# sajang.ai System Audit Report

## 1. Auth Flow (Gap Detected)

```mermaid
flowchart TD
    A[User visits sajang.ai] --> B{Authenticated?}
    B -->|No| C[/auth/login]
    B -->|Yes| D{Has Business?}

    C --> E[Login / Signup]
    E --> F[Supabase Auth]
    F --> G[/auth/callback]
    G --> D

    D -->|Yes| H[/dashboard]
    D -->|No| I[/auth/onboarding]

    I --> J[Register Business]
    J --> K[/auth/onboarding/preferences]
    K --> H

    style L fill:#ff4444,color:#fff,stroke:#cc0000
    L["GAP: Dashboard layout does NOT redirect\nwhen business is null.\nUser can skip onboarding\nby navigating directly to /dashboard"]

    D -.->|"Direct URL access\n(no business)"| L
    L -.-> H
```

## 2. Security Vulnerability Map

```mermaid
flowchart LR
    subgraph CRITICAL["CRITICAL"]
        V1["insights/dismiss\nIDOR - no ownership check"]
        V2["Rate Limit\nIP spoofable via X-Forwarded-For"]
        V3["Rate Limit\nIn-memory Map useless on Vercel"]
    end

    subgraph HIGH["HIGH"]
        V4["markInvoiceAsPaid\nIDOR - no business check"]
        V5["marketing/send\nredirect() in Route Handler"]
        V6["Dashboard layout\nNo onboarding enforcement"]
    end

    subgraph MEDIUM["MEDIUM"]
        V7["loans API\nNo Zod validation"]
        V8["budgets API\nNo Zod validation"]
        V9["insights/act\nactionType not validated"]
        V10["completeSyncLog\nlogId ownership gap"]
    end

    style CRITICAL fill:#ff4444,color:#fff
    style HIGH fill:#ff8800,color:#fff
    style MEDIUM fill:#ffcc00,color:#000
```

## 3. API Route Auth Coverage

```mermaid
flowchart TD
    subgraph PROTECTED["Auth + Ownership OK"]
        A1[POST /api/chat]
        A2[POST /api/ai]
        A3[POST /api/seri/report]
        A4[POST /api/dapjangi/process]
        A5[POST /api/insights/act]
        A6[POST /api/billing/*]
        A7[POST /api/sync]
        A8[PUT /api/profile/preferences]
    end

    subgraph PARTIAL["Auth OK, Ownership GAP"]
        B1["POST /api/insights/dismiss\n(no business ownership)"]
        B2["POST /api/loans\n(no input validation)"]
        B3["POST /api/budgets\n(no input validation)"]
        B4["POST /api/marketing/send\n(redirect() misuse)"]
    end

    subgraph CRON["CRON (Secret-based)"]
        C1["POST /api/cron/sync\n(CRON_SECRET null-risk)"]
        C2["POST /api/cron/daily-briefing\n(CRON_SECRET null-risk)"]
    end

    style PROTECTED fill:#22cc44,color:#fff
    style PARTIAL fill:#ff8800,color:#fff
    style CRON fill:#6666ff,color:#fff
```

## 4. Data Flow - Server Actions

```mermaid
flowchart TD
    subgraph ACTIONS["Server Actions (src/lib/actions/)"]
        SA1[business.ts] -->|getCurrentBusinessId| DB[(Supabase)]
        SA2[revenue.ts] -->|getCurrentBusinessId| DB
        SA3[expense.ts] -->|getCurrentBusinessId| DB
        SA4[fixed-cost.ts] -->|getCurrentBusinessId| DB
        SA5[csv-import.ts] -->|getCurrentBusinessId| DB
        SA6[connection.ts] -->|getCurrentBusinessId| DB
        SA7[vendor-actions.ts] -->|getCurrentBusinessId| DB
        SA8[invoice-actions.ts] -->|"addInvoice: OK\nmarkInvoiceAsPaid: NO CHECK"| DB
    end

    style SA8 fill:#ff4444,color:#fff
```

## 5. Layout Nesting

```mermaid
flowchart TD
    ROOT["Root Layout\n(fonts, metadata, toaster)"]

    ROOT --> AUTH["Auth Layout\n(min-h-screen bg-background)"]
    ROOT --> DASH["Dashboard Layout\n(sidebar, mobile-header)"]
    ROOT --> LEGAL["Legal Layout\n(no explicit layout)"]

    AUTH --> LOGIN["Login Page\n(fixed overlay modal)"]
    AUTH --> SIGNUP["Signup Page\n(redirects to login)"]
    AUTH --> ONBOARD["Onboarding Page\n(brand header + card)"]
    AUTH --> PREFS["Preferences Page\n(brand header + form)"]

    DASH --> PAGES["Dashboard Pages\n(revenue, expense, etc.)"]
    DASH --> SETTINGS["Settings Layout\n(settings nav)"]

    LEGAL --> PRIVACY[Privacy]
    LEGAL --> TERMS[Terms]
    LEGAL --> REFUND[Refund Policy]
```
