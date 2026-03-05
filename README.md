# CoFi Radar — AI Visibility Intelligence

Find out what AI says about your brand — and fix it.

## What it does

Every week, automatically, for every client:
- Tests 30 high-intent buyer questions across ChatGPT, Claude, Gemini, and Perplexity (120 API calls)
- Extracts structured data from every answer — brand mentions, competitor mentions, claims, risk flags
- Computes an AI Visibility Score (0–100) with four subscores
- Detects changes vs the previous week and generates alerts
- Generates a prioritized fix plan (P0/P1/P2)
- Sends a weekly email report with a one-click magic link to the dashboard

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local` and fill in all values:

```bash
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=radar@yourdomain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
```

### 3. Set up the database

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

The seed creates:
- 30 buyer queries across 5 intent categories
- 1 sample brand (Acme / acme.com / client@acme.com)

Update the brand in `prisma/seed.ts` or edit via `npx prisma studio` before going live.

### 4. Run locally

```bash
npm run dev
```

### 5. Trigger a run (test)

```bash
curl -X POST http://localhost:3000/api/run
```

Or with a specific brand:
```bash
curl -X POST "http://localhost:3000/api/run?brandId=<uuid>"
```

### 6. Client dashboard access

1. Update `clientEmail` in the Brand record to the client's email
2. The client receives a weekly email with a **"View your dashboard"** button
3. Clicking it signs them in automatically — no password, no shared URL
4. Their session is scoped to their `brandId` so they only see their own data

They can also sign in manually at `/auth/signin` using their email.

## Architecture

```
lib/
├── jobs/weeklyRun.ts      9-step automated pipeline
├── agents/
│   ├── testModel.ts       4 model adapters (OpenAI, Anthropic, Gemini, Perplexity)
│   ├── extractAnswer.ts   Claude-powered structured extraction
│   └── generateRecs.ts    Claude-powered P0/P1/P2 recommendations
├── scoring/computeScore.ts  Deterministic scoring algorithm
├── alerts/detectAlerts.ts   7 rule-based alert conditions
├── email/weeklyReport.tsx   HTML email + magic link generation
├── auth.ts                  NextAuth + Resend + brandId session scoping
└── cron.ts                  Sunday 3:00 AM America/Toronto
```

## Scoring algorithm

| Subscore | Weight | Formula |
|---|---|---|
| Visibility | 35% | Mention rate × 80 + top-3-rank bonus × 20 |
| Accuracy | 30% | 100 − (critical×20) − (high×8) − (medium×3) |
| Competitive | 20% | 100 − displaced% |
| Sentiment | 15% | Avg sentiment score of brand-mentioned responses |

## Cron

Runs every Sunday at 3:00 AM America/Toronto via `node-cron`. The cron is initialized in `lib/cron.ts` — wire it into your server startup (e.g. Next.js instrumentation file for production).

## Deployment

1. Push to Vercel: `vercel deploy`
2. Add all env vars in Vercel dashboard
3. Use Supabase or Railway for the database
4. Set `NEXTAUTH_URL` to your production domain

## v2 roadmap

- Truth cache crawler (auto-verify pricing/policy against official pages)
- Stripe billing + plan gating
- Multi-brand / agency mode
- PDF reports
- Slack webhooks
- Public benchmark pages (AI Visibility Index by industry)
