-- Subscription and payment tables for sajang.ai billing module
-- Plan framing: "점장 고용" (not "구독")

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null unique,
  plan text not null default 'trial' check (plan in ('trial', 'paid')),
  status text not null default 'trial' check (status in ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  billing_key text,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users can view own subscription" on subscriptions
  for select using (
    business_id in (select id from businesses where user_id = auth.uid())
  );

create policy "Users can update own subscription" on subscriptions
  for update using (
    business_id in (select id from businesses where user_id = auth.uid())
  );

-- Service role can insert/update subscriptions (for server-side operations)
create policy "Service role can manage subscriptions" on subscriptions
  for all using (auth.role() = 'service_role');

create table payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references subscriptions(id) on delete cascade not null,
  amount integer not null default 9900,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  portone_payment_id text,
  paid_at timestamptz,
  failed_reason text,
  retry_count integer default 0,
  created_at timestamptz default now()
);

alter table payments enable row level security;

create policy "Users can view own payments" on payments
  for select using (
    subscription_id in (
      select id from subscriptions
      where business_id in (
        select id from businesses where user_id = auth.uid()
      )
    )
  );

-- Service role can manage payments (for server-side billing operations)
create policy "Service role can manage payments" on payments
  for all using (auth.role() = 'service_role');

-- Trigger to update subscriptions.updated_at on row update
create or replace function update_subscriptions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row
  execute function update_subscriptions_updated_at();
