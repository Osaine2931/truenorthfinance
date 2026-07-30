# Deployment guide

## Vercel
1. Connect the GitHub repository to Vercel.
2. Set the environment variables from [.env.example](.env.example).
3. Deploy the project. Vercel will build the front end and the API routes automatically.

## Cron jobs
Set a Vercel Cron schedule such as `*/10 * * * *` and target `/api/cron` with the `CRON_SECRET` header.

## Cloudflare
1. Point the domain to Vercel.
2. Enable SSL/TLS and CDN.
3. Set the DNS records to the Vercel deployment targets.
