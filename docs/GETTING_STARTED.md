# Getting Started with RepurposeFlow

Quick start guide to get RepurposeFlow running locally.

## Prerequisites

Ensure you have the following:

- **Node.js 18+** ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **Code editor** (VS Code recommended)

## Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd repurposeflow

# Install dependencies
npm install
```

## Step 2: Set Up Environment Variables

```bash
# Copy example environment file
cp .env.example .env
```

Now open `.env` and fill in the required values. Follow steps 3-8 to get these values.

## Step 3: Database (Supabase)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for project to provision (~2 minutes)
4. Go to **Settings** → **Database**
5. Copy **Connection string** (Transaction mode) → This is your `DATABASE_URL`
6. Copy **Connection string** (Session mode) → This is your `DIRECT_URL`
7. Update `.env`:
   ```
   DATABASE_URL=your-pooled-connection-string?pgbouncer=true
   DIRECT_URL=your-direct-connection-string
   ```

## Step 4: Authentication (Clerk)

1. Go to [clerk.com](https://clerk.com)
2. Create a new application
3. Choose authentication methods (Email/Password + Google recommended)
4. Go to **API Keys**
5. Copy keys and update `.env`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

## Step 5: LLM Provider

### Option A: OpenAI (Recommended for MVP)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account and add billing
3. Go to **API Keys** → **Create new secret key**
4. Update `.env`:
   ```
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   ```

### Option B: Anthropic Claude

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account and add billing
3. Go to **API Keys** → **Create Key**
4. Update `.env`:
   ```
   LLM_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### Both (Recommended for Production)

Add both API keys for automatic failover.

## Step 6: Stripe (Payments)

1. Go to [stripe.com](https://stripe.com)
2. Create account
3. Stay in **Test mode** for development
4. Go to **Developers** → **API Keys**
5. Copy keys and update `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### Create Products

1. Go to **Products** → **Add Product**
2. Create **Pro Plan**:
   - Name: "Pro"
   - Price: $19/month (recurring)
   - Copy Price ID
3. Create **Business Plan**:
   - Name: "Business"
   - Price: $49/month (recurring)
   - Copy Price ID
4. Update `.env`:
   ```
   STRIPE_PRICE_ID_PRO=price_...
   STRIPE_PRICE_ID_BUSINESS=price_...
   ```

## Step 7: Upstash Redis (Rate Limiting)

1. Go to [upstash.com](https://upstash.com)
2. Create account
3. Create new Redis database
4. Choose any region (close to your users)
5. Go to **REST API** tab
6. Copy credentials and update `.env`:
   ```
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

## Step 8: Push Database Schema

```bash
npm run db:push
```

This creates all tables in your Supabase database.

## Step 9: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 10: Create Test User

1. Click **Sign Up**
2. Create account with email
3. You should be redirected to `/dashboard`

## Step 11: Test Generation

1. Paste sample content (minimum 100 characters):
   ```
   Content marketing has fundamentally changed over the past decade. What used to work - generic blog posts and mass email blasts - no longer drives results. Modern audiences demand authenticity, value, and personalization. The most successful content creators focus on building genuine connections with their audience through platform-specific content that resonates with how people consume information on each channel. This means understanding that a TikTok video requires a completely different approach than a LinkedIn post, even when discussing the same core message.
   ```

2. Select platforms (e.g., TikTok, Twitter, LinkedIn)
3. Choose tone (e.g., Educational)
4. Click **Generate Content**
5. Wait ~5-10 seconds
6. See generated content for each platform
7. Click **Copy** to test clipboard functionality

## Step 12: Set Up Webhooks (Important for Production)

### Clerk Webhooks

1. In Clerk dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. Enter URL: `http://localhost:3000/api/webhooks/clerk` (for local testing, use ngrok)
4. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy **Signing Secret** → Add to `.env` as `CLERK_WEBHOOK_SECRET`

### Stripe Webhooks

1. Install Stripe CLI: [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward events:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy webhook signing secret → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED
```

**Solution**: Check your `DATABASE_URL` is correct and includes `?pgbouncer=true`

### Clerk Authentication Error

```
Error: Clerk publishable key not found
```

**Solution**: Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is in `.env` and starts with `pk_`

### LLM Generation Error

```
Error: Invalid API key
```

**Solution**: Check your OpenAI or Anthropic API key is correct and has billing enabled

### Rate Limit Error

```
Error: Could not connect to Upstash
```

**Solution**: Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are correct

### Build Error

```
Type error: Cannot find module
```

**Solution**:
```bash
rm -rf node_modules .next
npm install
npm run dev
```

## Development Tips

### Useful Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Database schema changes
npm run db:push

# View database in browser
npm run db:studio
```

### Hot Reload

Next.js automatically reloads when you save files. If it doesn't:
1. Check terminal for errors
2. Restart dev server
3. Clear `.next` folder

### Testing Subscriptions Locally

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future date for expiry
- Any 3-digit CVC

### Viewing Logs

- **Application logs**: Terminal running `npm run dev`
- **Database logs**: Supabase dashboard → Logs
- **Stripe events**: Stripe dashboard → Developers → Events
- **Clerk events**: Clerk dashboard → Logs

## Next Steps

Once everything is working locally:

1. ✅ Review the architecture: `docs/ARCHITECTURE.md`
2. ✅ Understand the database: `docs/DATABASE_SCHEMA.md`
3. ✅ Review prompt templates: `prompts/` directory
4. ✅ Customize prompts for your use case
5. ✅ Test all platforms and tones
6. ✅ Prepare for deployment: `docs/MVP_LAUNCH_CHECKLIST.md`

## Need Help?

- **Architecture questions**: See `docs/ARCHITECTURE.md`
- **Database questions**: See `docs/DATABASE_SCHEMA.md`
- **Deployment questions**: See `docs/MVP_LAUNCH_CHECKLIST.md`
- **Code questions**: Review inline comments in source files

## Resources

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Clerk**: [clerk.com/docs](https://clerk.com/docs)
- **Stripe**: [stripe.com/docs](https://stripe.com/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Drizzle ORM**: [orm.drizzle.team](https://orm.drizzle.team)
- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
