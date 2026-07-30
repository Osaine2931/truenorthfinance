# TrueNorth Financial

TrueNorth Financial is a premium investment platform built with React, Vite, TypeScript, TanStack Router, and Supabase-backed APIs. The app includes authenticated dashboards, investment plans, wallet flows, payments, referrals, notifications, admin tools, and production-oriented deployment assets.

## Features
- Authentication and role-based access
- Investor dashboard and wallet flows
- Admin operations for users, plans, deposits, withdrawals, referrals, announcements, and settings
- NOWPayments-ready payment flow and webhook endpoint
- Automated investment maturity processing and live data refresh
- PWA support, SEO assets, and Vercel deployment guidance

## Local development
```bash
npm install
npm run dev
```

## Environment variables
Copy [.env.example](.env.example) to `.env.local` and fill in the required values.

## Production deployment
Follow [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel and Cloudflare setup.

