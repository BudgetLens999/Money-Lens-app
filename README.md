# MoneyLens

AI-powered personal finance SaaS. $20/mo, 30-day free trial.

## Setup

### 1. Deploy to Vercel

1. Push this folder to GitHub as a new repo (e.g. `moneylens-app`)
2. Go to vercel.com → Import Git Repository → select it
3. Vercel auto-detects Next.js

### 2. Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → Secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys → Publishable key |
| `STRIPE_PRICE_ID` | `price_1TTlJpHEBXZQELPQDP6E5FR0` |
| `STRIPE_WEBHOOK_SECRET` | See step 3 below |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |

### 3. Set up Stripe Webhook

1. Stripe → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://your-app.vercel.app/api/webhook`
3. Events to listen to:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Signing secret** → add as `STRIPE_WEBHOOK_SECRET`

### 4. Make yourself admin

After signing up with your own account:
1. Go to Supabase → Table Editor → profiles
2. Find your row → set `is_admin = true`
3. You now have access to `/admin`

### 5. Set up Supabase Auth

1. Supabase → Authentication → URL Configuration
2. Set Site URL to your Vercel URL
3. Add redirect URL: `https://your-app.vercel.app/auth/callback`
