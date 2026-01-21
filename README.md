# MetroGlassOps

Internal operations system for MetroGlass Pro Inc - a custom shower glass installation business serving NYC, NJ, and CT.

## Features

- **Job Management**: Create, track, and manage installation jobs from estimate to completion
- **Expense Tracking**: Log expenses with receipt photos, AI-powered receipt extraction
- **Payment Recording**: Track deposits and final payments with confirmation screenshots
- **Invoice Generation**: Create professional PDF invoices with discount and tax options
- **Reminders**: Set priority-based reminders for follow-ups and payments
- **Dashboard**: View monthly revenue, expenses, net profit, and jobs needing attention
- **Client Management**: Track client information and view their job history
- **PWA Support**: Install as a home screen app on iOS/Android

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **PDF Generation**: jsPDF
- **AI**: Google Gemini Flash for receipt extraction
- **Deployment**: Vercel

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file: `supabase/migrations/001_initial_schema.sql`
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

### 5. Custom Domain Setup

To use `ops.metroglasspro.com`:
1. In Vercel, go to Settings > Domains > Add `ops.metroglasspro.com`
2. Add CNAME record: `ops` → `cname.vercel-dns.com`

## Usage

### Quick Actions
Tap the **+** button to quickly add jobs, expenses, payments, or reminders.

### Job Workflow
Estimate → Deposit Received → Measured → Ordered → Installed → Closed

### Dashboard Alerts
- **Red**: Payment collection
- **Orange**: Orders/scheduling
- **Green**: Follow-ups

---
© 2025 MetroGlass Pro Inc
