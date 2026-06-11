# Cloudflare Production Setup Guide for myatsscore.app

To optimize your Next.js frontend and FastAPI backend, follow these configurations in your Cloudflare dashboard.

## 1. DNS Settings

Point your nameservers from your domain registrar (e.g., Namecheap, GoDaddy) to the two custom Cloudflare nameservers provided in your Cloudflare dashboard.

Add the following DNS records:
- **Type A / CNAME**: Root `@` pointing to your Vercel project's assigned IP or CNAME (`cname.vercel-dns.com.`). Ensure Proxy Status is **Proxied (Orange Cloud)**.
- **Type CNAME**: `www` pointing to `cname.vercel-dns.com.`. **Proxied (Orange Cloud)**.
- **Type CNAME**: `api` pointing to your Railway public domain (e.g., `myatsscore-backend-production.up.railway.app`). **Proxied (Orange Cloud)**.

## 2. SSL/TLS Configuration

Go to the SSL/TLS tab:
- **Encryption Mode**: Set to **Full (Strict)**. (Both Vercel and Railway issue free SSL certificates, meaning Cloudflare should strictly trust them).
- Enable **Always Use HTTPS** in the Edge Certificates tab.

## 3. Page Rules (Caching)

Navigate to **Rules > Page Rules** and create the following two rules in exact priority order (Top to Bottom):

### Rule 1: Bypass Cache for API (Priority 1)
- **URL Match**: `*myatsscore.app/api/*` OR `api.myatsscore.app/*` (depending on your setup)
- **Setting**: `Cache Level` = `Bypass`
- *Reason*: Your FastAPI endpoints (especially webhooks and payment verifications) must never be cached by Cloudflare.

### Rule 2: Cache Static Assets (Priority 2)
- **URL Match**: `*myatsscore.app/_next/static/*`
- **Settings**: 
  - `Browser Cache TTL` = `A month`
  - `Edge Cache TTL` = `A month`
  - `Cache Level` = `Cache Everything`
- *Reason*: Greatly reduces load on Vercel and speeds up client loads by serving JS/CSS directly from Cloudflare's edge nodes.

## 4. Environment Secrets Validation

Ensure the following variables are injected into your respective environments:

### Railway (Backend Variables)
- `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `SENTRY_DSN`
- `REDIS_URL` (From Upstash integration)
- `OLLAMA_URL` (From your secondary Railway Ollama service)

### Vercel (Frontend Variables)
- `NEXT_PUBLIC_API_URL` (e.g., `https://api.myatsscore.app`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `NEXT_PUBLIC_SENTRY_DSN`

*Once Cloudflare DNS propagates, Vercel will auto-issue the certificates and your Next.js application will be live globally!*
