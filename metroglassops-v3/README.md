# MetroGlassOps V2

Internal operations system for MetroGlass Pro Inc - a custom shower glass installation business serving NYC, NJ, and CT.

## What's New in V2

- **🌙 Dark Mode**: Manual toggle in Settings for comfortable viewing
- **📊 Reports Dashboard**: Monthly, quarterly, and yearly analytics with charts
- **💰 Stripe Fee Tracking**: Automatic calculation of 2.9% + $0.30 fees
- **🔧 Job Specifications**: Track glass type, thickness, hardware finish, configuration, and dimensions
- **💵 Job Values**: Invoice totals displayed on job cards
- **📁 Expanded Expense Categories**: Job costs (Glass, Hardware, Consumables, Subcontractor) and Business expenses (Gas, Vehicle, Tools, Office, Meals)
- **✏️ Expense/Payment Management**: Edit and delete expenses and payments
- **🎯 Motivational Dashboard**: Compare revenue to last month with encouragement messages
- **📋 Client Stats**: Total jobs, revenue, and outstanding balance per client

## Features

- **Job Management**: Create, track, and manage installation jobs from estimate to completion
- **Job Specifications**: Track glass type, thickness, hardware finish, and configuration
- **Expense Tracking**: Log expenses with receipt photos, categorized by type
- **Payment Recording**: Track deposits and final payments with Stripe fee calculation
- **Invoice Generation**: Create professional PDF invoices with discount and tax options
- **Reminders**: Set priority-based reminders for follow-ups and payments
- **Dashboard**: View monthly revenue, expenses, net profit, and jobs needing attention
- **Reports**: Monthly/quarterly/yearly analytics with profit margins
- **Client Management**: Track client information with stats dashboard
- **PWA Support**: Install as a home screen app on iOS/Android
- **Dark Mode**: Manual toggle for light/dark themes

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **PDF Generation**: jsPDF
- **AI**: Google Gemini Flash for receipt extraction
- **Deployment**: Vercel

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_v2_enhancements.sql`
3. (Optional) Run the seed file for sample data: `supabase/seed.sql`
4. Create Storage Buckets:
   - Go to Storage > Create Bucket
   - Create `receipts` bucket (private)
   - Create `invoices` bucket (public)
5. Create Users:
   - Go to Authentication > Users > Add User
   - Create user: `donaldlena@metroglasspro.com` / `metroglasspro9896`
   - Create user: `ledionlico@metroglasspro.com` / `metroglasspro9896`

### 2. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_AI_API_KEY=your-google-ai-key
NEXT_PUBLIC_APP_URL=https://ops.metroglasspro.com
```

### 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### 5. V2 Migration (Existing Deployments)

If upgrading from V1, run the migration in Supabase SQL Editor:
```sql
-- Run this file: supabase/migrations/002_v2_enhancements.sql
```

### 6. Custom Domain Setup

To use `ops.metroglasspro.com`:
1. In Vercel, go to Settings > Domains > Add `ops.metroglasspro.com`
2. Add CNAME record: `ops` → `cname.vercel-dns.com`

## Usage

### Quick Actions
Tap the **+** button to quickly add jobs, expenses, payments, reminders, or invoices.

### Job Workflow
Estimate → Deposit Received → Measured → Ordered → Installed → Closed

### Dashboard
- **Centered greeting** with motivational messages based on performance
- **Monthly stats** showing revenue, expenses, and net profit
- **Jobs needing attention** with action alerts

### Reports
Access from Settings to view:
- Monthly/Quarterly/Yearly revenue and expenses
- Expense breakdown by category
- Revenue by payment method
- Job profit margins

### Dark Mode
Toggle in Settings > Appearance

---
© 2025 MetroGlass Pro Inc
