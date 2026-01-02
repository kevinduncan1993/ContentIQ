# 🚀 RepurposeFlow Launch Guide

Let's get your SaaS live! Follow these steps in order.

## ⏱️ Time Required: ~2-3 hours total

- Setup accounts: 45-60 min
- Environment configuration: 15 min
- Testing locally: 15-30 min
- Deployment: 15-30 min
- Post-deployment setup: 15-30 min

---

## STEP 1: Create Required Accounts (45-60 min)

You'll need accounts for these services. Open each link and create an account:

### 1.1 Database - Supabase (FREE tier available)
- Go to: https://supabase.com
- Click "Start your project"
- Create account (use Google/GitHub for speed)
- Create a new project:
  - **Project name**: repurposeflow
  - **Database password**: Generate strong password (save it!)
  - **Region**: Choose closest to your users
- ⏳ Wait ~2 minutes for provisioning

### 1.2 Authentication - Clerk (FREE tier: 10k MAU)
- Go to: https://clerk.com
- Click "Get started free"
- Create account
- Create new application:
  - **Application name**: RepurposeFlow
  - **Sign-in options**: Email + Google (recommended)

### 1.3 Payments - Stripe (FREE, pay only on transactions)
- Go to: https://stripe.com
- Click "Start now"
- Create account
- Complete business verification (can do later, stay in test mode for now)

### 1.4 LLM Provider - OpenAI or Anthropic

**Option A: OpenAI (Recommended for MVP)**
- Go to: https://platform.openai.com
- Create account
- Go to **Billing** → Add payment method (required for API access)
- Go to **API Keys** → Create new key

**Option B: Anthropic Claude**
- Go to: https://console.anthropic.com
- Create account
- Add billing method
- Create API key

**Best: Get both for failover**

### 1.5 Caching & Rate Limiting - Upstash Redis (FREE tier available)
- Go to: https://upstash.com
- Create account
- Click "Create Database"
- Choose any region
- Select **REST API** tab (you'll need these credentials)

### 1.6 Deployment - Vercel (FREE for hobby)
- Go to: https://vercel.com
- Sign up with **GitHub** (important!)

### 1.7 Version Control - GitHub
- Go to: https://github.com
- Create account if you don't have one
- Create a **new repository**: repurposeflow (public or private)

---

## STEP 2: Get API Keys & Credentials (15 min)

Open a text file and collect these values:

### 2.1 Supabase
1. In Supabase dashboard → **Settings** → **Database**
2. Scroll to "Connection string"
3. Copy **Transaction pooler** (URI):
   ```
   DATABASE_URL=postgresql://...?pgbouncer=true
   ```
4. Copy **Session pooler** (URI):
   ```
   DIRECT_URL=postgresql://...
   ```

### 2.2 Clerk
1. In Clerk dashboard → **API Keys**
2. Copy:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
3. We'll get webhook secret later

### 2.3 Stripe
1. In Stripe dashboard → **Developers** → **API Keys**
2. Make sure you're in **Test mode** (toggle in sidebar)
3. Copy:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### 2.4 OpenAI or Claude
Copy your API key:
```
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
```

### 2.5 Upstash Redis
1. In Upstash dashboard → Click your database
2. Go to **REST API** tab
3. Copy:
   ```
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

---

## STEP 3: Create Stripe Products (10 min)

1. In Stripe dashboard → **Products**
2. Click **Add product**

### Create Pro Plan
- **Name**: Pro Plan
- **Description**: 500 generations per month
- **Pricing**:
  - **Price**: $19.00 USD
  - **Billing period**: Monthly
  - **Recurring**
- Click **Save product**
- **Copy the Price ID** (starts with `price_...`)

### Create Business Plan
- **Name**: Business Plan
- **Description**: Unlimited generations
- **Pricing**:
  - **Price**: $49.00 USD
  - **Billing period**: Monthly
  - **Recurring**
- Click **Save product**
- **Copy the Price ID**

Save these:
```
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_BUSINESS=price_...
```

---

## STEP 4: Push Code to GitHub (5 min)

```bash
# Add GitHub remote (replace with YOUR repo URL)
git remote add origin https://github.com/YOUR-USERNAME/repurposeflow.git

# Push code
git push -u origin main
```

---

## STEP 5: Deploy to Vercel (10 min)

1. Go to: https://vercel.com/new
2. Click **Import Project**
3. Select your GitHub repository: **repurposeflow**
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: npm run build
   - **Output Directory**: .next

5. **Add Environment Variables** (click "Environment Variables"):

Paste ALL of these (replace with your actual values):

```bash
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Database
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# LLM Provider
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_BUSINESS=price_...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

6. Click **Deploy**
7. ⏳ Wait 2-3 minutes for deployment
8. **Copy your deployment URL**: `https://your-app.vercel.app`

---

## STEP 6: Set Up Database (5 min)

We need to push the database schema to Supabase.

### Option A: Use Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env

# Install dependencies
npm install

# Push database schema
npm run db:push
```

### Option B: Manual Setup

1. Create `.env` file in project root
2. Copy all environment variables from Vercel
3. Run:
```bash
npm install
npm run db:push
```

---

## STEP 7: Configure Webhooks (15 min)

### 7.1 Clerk Webhooks

1. In Clerk dashboard → **Webhooks** → **Add Endpoint**
2. **Endpoint URL**: `https://your-app.vercel.app/api/webhooks/clerk`
3. **Subscribe to events**:
   - ✅ user.created
   - ✅ user.updated
   - ✅ user.deleted
4. Click **Create**
5. **Copy Signing Secret** (starts with `whsec_...`)
6. In Vercel:
   - Go to **Settings** → **Environment Variables**
   - Add: `CLERK_WEBHOOK_SECRET=whsec_...`
   - **Redeploy** (Vercel will prompt)

### 7.2 Stripe Webhooks

1. In Stripe dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://your-app.vercel.app/api/webhooks/stripe`
4. **Events to send**:
   - ✅ checkout.session.completed
   - ✅ customer.subscription.created
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ invoice.payment_failed
5. Click **Add endpoint**
6. Click on the webhook → **Signing secret** → **Reveal**
7. Copy the secret (starts with `whsec_...`)
8. In Vercel:
   - Add: `STRIPE_WEBHOOK_SECRET=whsec_...`
   - **Redeploy**

---

## STEP 8: Test Your App! (15 min)

### 8.1 Visit Your Site
Go to: `https://your-app.vercel.app`

### 8.2 Create Test User
1. Click **Sign Up**
2. Create account with your email
3. You should land on `/dashboard`

### 8.3 Test Generation
1. Paste this sample content:
```
Content marketing has fundamentally changed. What used to work - generic blog posts and mass emails - no longer drives results. Modern audiences demand authenticity, value, and personalization. The most successful content creators focus on building genuine connections through platform-specific content. This means understanding that a TikTok video requires a completely different approach than a LinkedIn post, even when discussing the same core message.
```

2. Select platforms: TikTok, Twitter, LinkedIn
3. Choose tone: Educational
4. Click **Generate Content**
5. Wait ~5-10 seconds
6. ✅ You should see generated content for each platform!
7. Test **Copy** button

### 8.4 Check Database
1. Go to Supabase dashboard
2. Click **Table Editor**
3. You should see:
   - `users` table with your user
   - `generations` table with your generation
   - `usage_logs` table with usage entry

### 8.5 Test Stripe (Optional)
1. Click **Billing** in your app
2. Try to upgrade to Pro
3. Use test card: `4242 4242 4242 4242`
4. Any future date, any CVC
5. Complete checkout
6. You should be upgraded!

---

## STEP 9: Monitor & Verify (5 min)

### 9.1 Check Vercel Logs
- Vercel dashboard → Your project → **Logs**
- Should see successful requests

### 9.2 Check for Errors
- Vercel → **Functions** → Check for any errors
- If errors, review environment variables

### 9.3 Test All Platforms
Generate content with all 6 platforms to ensure everything works

---

## STEP 10: Go Live with Real Payments (When Ready)

### Switch Stripe to Live Mode

1. In Stripe → Toggle to **Live Mode**
2. **Complete business verification** (required for live mode)
3. Create products again in Live Mode:
   - Pro Plan: $19/month
   - Business Plan: $49/month
4. Get new Live API keys:
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
   - New Price IDs
5. Update Vercel environment variables
6. Set up Live Mode webhook (same URL)
7. **Redeploy**

### Switch Clerk to Production

1. Clerk dashboard → **Domains**
2. Add your custom domain (optional)
3. Update environment if needed

---

## 🎉 You're Live!

Your SaaS is now running at: `https://your-app.vercel.app`

## Next Steps

1. **Custom Domain** (Optional):
   - Vercel dashboard → **Settings** → **Domains**
   - Add your domain (e.g., repurposeflow.com)
   - Update DNS settings

2. **Monitoring**:
   - Set up Sentry for error tracking
   - Set up PostHog for analytics
   - Monitor Vercel analytics

3. **Marketing**:
   - Create landing page
   - Add social auth (Google, GitHub)
   - Set up email marketing

4. **Iterate**:
   - Monitor user feedback
   - Track success metrics
   - Add features based on usage

---

## 📊 Quick Reference - What You Built

- ✅ 6 platform generators
- ✅ 4 tone variations
- ✅ User authentication
- ✅ Subscription billing
- ✅ Usage tracking
- ✅ Rate limiting
- ✅ Database with history
- ✅ Mobile responsive

## 💰 Pricing

- **Free**: 10 generations/month
- **Pro**: $19/month - 500 generations
- **Business**: $49/month - Unlimited

## 🆘 Troubleshooting

**Build Failed?**
- Check environment variables are all set
- Look at Vercel build logs
- Common: Missing `NEXT_PUBLIC_` prefix for client vars

**Database Connection Error?**
- Verify `DATABASE_URL` includes `?pgbouncer=true`
- Check Supabase project is active
- Run `npm run db:push` again

**Generation Not Working?**
- Check LLM API key is valid
- Check you have billing enabled on OpenAI/Claude
- View function logs in Vercel

**Webhooks Not Working?**
- Verify webhook URLs are correct
- Check webhook secrets are set
- Test webhook in Stripe/Clerk dashboard

---

## 📞 Resources

- **Docs**: See `/docs` folder
- **Architecture**: `docs/ARCHITECTURE.md`
- **Database**: `docs/DATABASE_SCHEMA.md`
- **Full Checklist**: `docs/MVP_LAUNCH_CHECKLIST.md`

---

**You did it!** 🎊 Your SaaS is live and ready to accept payments!

Share your launch: [@YourTwitter](https://twitter.com)
