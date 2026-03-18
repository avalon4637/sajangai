-- Daily reports table for caching AI-generated analysis results
-- Stores seri (financial), dapjangi (review), and jeongjang (briefing) reports

create table daily_reports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  report_date date not null,
  report_type text not null check (report_type in ('seri_profit', 'seri_cashflow', 'seri_cost', 'dapjangi_review', 'jeongjang_briefing')),
  content jsonb not null,
  summary text,
  created_at timestamptz default now(),
  unique(business_id, report_date, report_type)
);

alter table daily_reports enable row level security;

create policy "Users can view own reports" on daily_reports
  for select using (
    business_id in (select id from businesses where user_id = auth.uid())
  );

create policy "System can insert reports" on daily_reports
  for insert with check (
    business_id in (select id from businesses where user_id = auth.uid())
  );

create policy "System can update reports" on daily_reports
  for update using (
    business_id in (select id from businesses where user_id = auth.uid())
  );

-- Index for fast lookups by business + date + type
create index idx_daily_reports_business_date on daily_reports(business_id, report_date desc);
create index idx_daily_reports_type on daily_reports(business_id, report_type, report_date desc);
