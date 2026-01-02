# ContentIQ Setup Checklist

Follow these steps to get your app fully functional.

## ✅ Step 1: Database Setup (REQUIRED)

### Option A: Vercel Postgres (Recommended - Easiest)
1. Go to https://vercel.com/your-username/contentiq
2. Click **Storage** tab
3. Click **Create Database** → Select **Postgres**
4. Click **Create**
5. ✅ This automatically adds `POSTGRES_URL` to your environment variables

### Option B: Supabase
1. Go to https://supabase.com → Sign in
2. Create new project
3. Go to **Project Settings** → **Database**
4. Copy the **Connection String** (URI format)
5. In Vercel: **Settings** → **Environment Variables** → Add:
   - Key: `DATABASE_URL`
   - Value: Your Supabase connection string

---

## ✅ Step 2: Run Database Migrations

After creating your database, you need to create the tables.

### If using Vercel Postgres:
1. In your Vercel project, go to **Storage** → Your Postgres database
2. Click **Query** tab
3. Copy the entire contents of `drizzle/0000_daffy_steve_rogers.sql` from your local project
4. Paste into the query editor and click **Run**
5. ✅ You should see "Queries executed successfully"

### If using Supabase:
1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `drizzle/0000_daffy_steve_rogers.sql`
4. Paste and click **Run**
5. ✅ Tables created

---

## ✅ Step 3: Set Up Clerk Webhook (REQUIRED)

Your app needs to sync user data from Clerk to your database.

1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to **Webhooks** → Click **Add Endpoint**
4. Enter webhook URL: `https://your-vercel-app.vercel.app/api/webhooks/clerk`
   - Replace `your-vercel-app` with your actual Vercel URL
5. Subscribe to these events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
6. Click **Create**
7. Copy the **Signing Secret** (starts with `whsec_`)
8. In Vercel: **Settings** → **Environment Variables** → Add:
   - Key: `CLERK_WEBHOOK_SECRET`
   - Value: The signing secret you just copied

---

## ✅ Step 4: Add LLM Provider (REQUIRED for content generation)

Choose one or both:

### Option A: OpenAI (Recommended)
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. In Vercel: **Settings** → **Environment Variables** → Add:
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI key (starts with `sk-`)

### Option B: Anthropic Claude
1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. In Vercel: **Settings** → **Environment Variables** → Add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic key

---

## ✅ Step 5: Add Required Environment Variables

In Vercel **Settings** → **Environment Variables**, add:

### Already Set ✅
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### Need to Add:
- `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
- `CLERK_WEBHOOK_SECRET` = (from Step 3)
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` = (from Step 4)

---

## 🔧 Optional: Stripe for Billing (Can skip for now)

### To enable paid subscriptions:
1. Go to https://dashboard.stripe.com
2. Get your **Secret Key** from **Developers** → **API Keys**
3. Create two products in **Products**:
   - **Pro Plan** ($X/month)
   - **Business Plan** ($X/month)
4. Copy the **Price IDs** for each
5. In Vercel Environment Variables, add:
   - `STRIPE_SECRET_KEY` = Your Stripe secret key
   - `STRIPE_PRICE_ID_PRO` = Pro plan price ID
   - `STRIPE_PRICE_ID_BUSINESS` = Business plan price ID

### Set up Stripe Webhook:
1. In Stripe: **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://your-app.vercel.app/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
4. Copy webhook signing secret
5. Add to Vercel: `STRIPE_WEBHOOK_SECRET`

---

## 🔧 Optional: Redis for Rate Limiting (Can skip for now)

### To enable rate limiting:
1. Go to https://upstash.com → Create account
2. Create a **Redis** database
3. Copy **REST URL** and **REST TOKEN**
4. In Vercel Environment Variables:
   - `UPSTASH_REDIS_REST_URL` = Your Redis URL
   - `UPSTASH_REDIS_REST_TOKEN` = Your token

---

## 🚀 Step 6: Redeploy

After adding all environment variables:

1. In Vercel, go to **Deployments**
2. Click ⋯ on the latest deployment → **Redeploy**
3. Check "Use existing build cache" → Click **Redeploy**

---

## ✅ Step 7: Test Your App

1. Visit your app URL
2. Sign in with Clerk
3. You should see the dashboard (not a blank page!)
4. Try generating content

---

## 🎯 Minimum Required for Basic Functionality

To just get the app running and see the dashboard:

1. ✅ Database (Step 1 + 2) - **MUST DO**
2. ✅ Clerk Webhook (Step 3) - **MUST DO**
3. ✅ One LLM API key (Step 4) - **MUST DO for generation**
4. ✅ Redeploy (Step 6) - **MUST DO**

Stripe and Redis are optional - the app will work without them (with free tier only, no rate limiting).

---

## 📝 Current Status

- ✅ Code deployed to Vercel
- ✅ Clerk authentication configured
- ⏳ Database setup needed
- ⏳ Webhook setup needed
- ⏳ LLM API key needed

---

## Need Help?

If you get stuck on any step, let me know which step and I'll help you through it!
