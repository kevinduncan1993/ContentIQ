# ContentIQ MVP Testing Guide

## Pre-Launch Checklist

### 1. Environment Variables (Vercel)

Ensure all these are set in Vercel:

**Authentication:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

**Database:**
- `DATABASE_URL` (Supabase connection string)

**LLM Provider:**
- `GOOGLE_API_KEY` (Gemini API)
- `LLM_PROVIDER=gemini`

**Stripe:**
- `STRIPE_SECRET_KEY` (live key)
- `STRIPE_PUBLISHABLE_KEY` (live key)
- `STRIPE_WEBHOOK_SECRET` (live webhook secret)
- `STRIPE_PRICE_ID_PRO` (your Pro price ID)
- `STRIPE_PRICE_ID_BUSINESS` (optional)

**App:**
- `NEXT_PUBLIC_APP_URL=https://contentiq-nine.vercel.app`

---

## Testing Flow

### Phase 1: New User Sign-Up & Trial

1. **Sign Up**
   - Visit landing page
   - Click "Get Started Free"
   - Create new account with Clerk
   - Verify redirect to dashboard

2. **Trial Features**
   - Check usage stats shows "Free" tier
   - Verify trial banner shows "X days/hours remaining"
   - Confirm all 6 platforms are available during trial
   - Try generating content for TikTok (should work)
   - Try generating content for Instagram (should work)

3. **Content Generation**
   - Paste 100+ character content
   - Select 2-3 platforms
   - Choose a tone
   - Click "Generate Content"
   - Verify content generates successfully
   - Test copy buttons on each platform output
   - Check generation appears in history page

### Phase 2: Trial Expiration

**Option A: Wait 3 days (not practical)**
**Option B: Manually update database:**

```sql
UPDATE users 
SET created_at = created_at - INTERVAL '4 days' 
WHERE email = 'your-test-email@example.com';
```

Then test:
1. Refresh dashboard
2. Verify trial expired banner shows (red)
3. Try selecting Instagram or TikTok
4. Should show "Pro only" lock icon
5. Clicking locked platform shows upgrade toast
6. Try generating with locked platform
7. Should get 403 error

### Phase 3: Payment Flow

1. **Upgrade to Pro**
   - Click "Upgrade to Pro" or visit /billing
   - Click "Upgrade to Pro" button
   - Redirected to Stripe checkout
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry, any CVC
   - Complete payment

2. **Verify Webhook**
   - Check Vercel logs for webhook events
   - Webhook should update user tier to "pro"
   - Dashboard should show "Pro" tier
   - All platforms should unlock
   - Trial banner should disappear

3. **Generate as Pro User**
   - Try generating content for all platforms
   - Verify quota is now 500/month
   - Check history shows new generation

### Phase 4: Subscription Management

1. **Manage Subscription**
   - Go to /billing
   - Click "Manage Subscription" button
   - Should redirect to Stripe Customer Portal
   - Test updating payment method
   - Test viewing invoices
   - **DO NOT** cancel subscription yet

2. **Cancel Subscription**
   - In Customer Portal, click "Cancel subscription"
   - Choose cancel at period end
   - Return to billing page
   - Should still show "Pro" (until period ends)

3. **Verify Cancellation Webhook**
   - Check Vercel logs for `customer.subscription.updated`
   - Tier should remain "pro" until period end
   - After period ends, webhook `customer.subscription.deleted` fires
   - User should downgrade to "free"

---

## Critical Tests

### Authentication
- [ ] Sign up works
- [ ] Sign in works
- [ ] Sign out works
- [ ] Protected routes redirect to sign-in
- [ ] Clerk webhook creates user in database

### Content Generation
- [ ] Can generate content with valid input
- [ ] Validation works (100 char minimum)
- [ ] Platform selection works
- [ ] Tone selection works
- [ ] Copy buttons work
- [ ] Generated content displays correctly

### Tier System
- [ ] Free tier shows trial countdown
- [ ] Trial gives access to all platforms
- [ ] After trial, only Threads/LinkedIn available
- [ ] Locked platforms show lock icon
- [ ] Locked platforms can't be used
- [ ] Pro tier unlocks all platforms

### Payment System
- [ ] Stripe checkout link works
- [ ] Test payment processes
- [ ] Webhook updates user tier
- [ ] Pro features unlock immediately
- [ ] Customer portal link works
- [ ] Can manage subscription
- [ ] Cancellation works correctly

### UI/UX
- [ ] Landing page loads
- [ ] Dark theme consistent
- [ ] Mobile responsive
- [ ] Copy buttons work
- [ ] Toast notifications show
- [ ] Loading states work

### History & Data
- [ ] Generations save to database
- [ ] History page shows past generations
- [ ] Can expand/collapse generations
- [ ] Can copy past content
- [ ] Usage stats accurate

---

## Known Issues to Watch For

1. **Webhook Timing**
   - Stripe webhooks can take 1-2 seconds
   - User might need to refresh page after payment

2. **Trial Calculation**
   - Based on `users.created_at` timestamp
   - Make sure timezone is correct

3. **Redis Rate Limiting**
   - Currently disabled (not critical for MVP)
   - Can enable later with Upstash

4. **First Generation**
   - First generation might be slow (cold start)
   - Subsequent generations should be faster

---

## Launch Checklist

- [ ] All environment variables set in Vercel
- [ ] Stripe webhook endpoint configured: `https://contentiq-nine.vercel.app/api/webhooks/stripe`
- [ ] Stripe webhook events subscribed:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- [ ] Clerk webhook endpoint configured: `https://contentiq-nine.vercel.app/api/webhooks/clerk`
- [ ] Clerk webhook events subscribed:
  - `user.created`
  - `user.updated`
  - `user.deleted`
- [ ] Tested full payment flow end-to-end
- [ ] Tested trial system
- [ ] Verified content generation works
- [ ] Checked history page
- [ ] Confirmed customer portal works
- [ ] Mobile responsive checked
- [ ] Error handling tested

---

## Support & Monitoring

**Monitor These:**
1. Vercel logs for errors
2. Stripe dashboard for payments
3. Supabase database for user records
4. Clerk dashboard for auth issues

**Common Issues:**
- Webhook signature verification fails → Check webhook secrets
- User not found → Clerk webhook might not have fired
- Generation fails → Check Gemini API key and quota
- Payment doesn't unlock features → Check Stripe webhook logs

---

## You're Ready to Launch! 🚀

Your MVP has:
✅ Full authentication system
✅ Content generation for 6 platforms
✅ Tiered access with trials
✅ Payment processing
✅ Subscription management
✅ Generation history
✅ Professional UI/UX

Just complete the testing checklist above and you're good to go!
