# RepurposeFlow - MVP Launch Checklist

Complete production-ready launch checklist for RepurposeFlow SaaS.

## Pre-Launch Setup

### 1. Environment Setup

#### Development Environment
- [ ] Node.js 18+ installed
- [ ] Git repository initialized
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created from `.env.example`
- [ ] Development server running (`npm run dev`)

#### Production Environment
- [ ] Vercel account created
- [ ] GitHub repository connected to Vercel
- [ ] Production branch configured (main/master)

### 2. Database Setup (Supabase)

- [ ] Supabase project created
- [ ] Database connection strings obtained:
  - [ ] `DATABASE_URL` (pooled connection)
  - [ ] `DIRECT_URL` (direct connection)
- [ ] Connection strings added to `.env`
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Database indexes verified
- [ ] Connection pooling configured (PgBouncer)
- [ ] Database backups enabled (automatic in Supabase)
- [ ] Row-level security policies reviewed

### 3. Authentication (Clerk)

- [ ] Clerk application created
- [ ] OAuth providers configured:
  - [ ] Google
  - [ ] GitHub (optional)
- [ ] Email/password authentication enabled
- [ ] Clerk keys added to environment:
  - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - [ ] `CLERK_SECRET_KEY`
- [ ] Webhook endpoint configured:
  - [ ] URL: `https://yourdomain.com/api/webhooks/clerk`
  - [ ] Events: `user.created`, `user.updated`, `user.deleted`
  - [ ] `CLERK_WEBHOOK_SECRET` saved
- [ ] Session settings configured
- [ ] Custom sign-in/sign-up pages (optional)
- [ ] Test user account created
- [ ] User creation flow tested

### 4. LLM Provider Setup

#### Option A: OpenAI
- [ ] OpenAI account created
- [ ] API key generated
- [ ] `OPENAI_API_KEY` added to environment
- [ ] Billing enabled and payment method added
- [ ] Usage limits set
- [ ] `LLM_PROVIDER=openai` set in environment

#### Option B: Anthropic Claude
- [ ] Anthropic account created
- [ ] API key generated
- [ ] `ANTHROPIC_API_KEY` added to environment
- [ ] Billing enabled
- [ ] `LLM_PROVIDER=anthropic` set in environment

#### Recommended: Both (for failover)
- [ ] Both API keys configured
- [ ] Failover logic tested
- [ ] Preferred provider set

### 5. Payment Processing (Stripe)

- [ ] Stripe account created
- [ ] Business verified (for live mode)
- [ ] Test mode keys obtained:
  - [ ] `STRIPE_SECRET_KEY` (test)
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test)
- [ ] Products created:
  - [ ] **Pro Plan** - $19/month (or $190/year)
  - [ ] **Business Plan** - $49/month (or $490/year)
- [ ] Price IDs saved:
  - [ ] `STRIPE_PRICE_ID_PRO`
  - [ ] `STRIPE_PRICE_ID_BUSINESS`
- [ ] Webhook endpoint configured:
  - [ ] URL: `https://yourdomain.com/api/webhooks/stripe`
  - [ ] Events selected:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_failed`
  - [ ] `STRIPE_WEBHOOK_SECRET` saved
- [ ] Customer portal configured
- [ ] Test subscription created and verified
- [ ] Webhook events tested

### 6. Caching & Rate Limiting (Upstash Redis)

- [ ] Upstash account created
- [ ] Redis database created
- [ ] REST API credentials obtained:
  - [ ] `UPSTASH_REDIS_REST_URL`
  - [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] Rate limits configured:
  - [ ] Per-user: 10 req/min
  - [ ] Per-IP: 20 req/min
  - [ ] Global: 1000 req/min
- [ ] Rate limiting tested

### 7. Monitoring (Optional but Recommended)

#### Sentry (Error Tracking)
- [ ] Sentry project created
- [ ] `SENTRY_DSN` added to environment
- [ ] Error tracking tested

#### PostHog (Product Analytics)
- [ ] PostHog account created
- [ ] Project created
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` added
- [ ] Event tracking tested

#### Vercel Analytics
- [ ] Enabled in Vercel dashboard
- [ ] Performance tracking verified

## Testing Phase

### 8. Functional Testing

#### User Flows
- [ ] User sign-up works
- [ ] User sign-in works
- [ ] User profile creation works
- [ ] Stripe customer creation works

#### Generation Flow
- [ ] Content input validation works
- [ ] Platform selection works
- [ ] Tone selection works
- [ ] Generation request succeeds
- [ ] All 6 platforms generate correctly:
  - [ ] TikTok/Reels
  - [ ] Twitter/X
  - [ ] LinkedIn
  - [ ] Instagram
  - [ ] Threads
  - [ ] Email
- [ ] All 4 tones work correctly:
  - [ ] Educational
  - [ ] Conversational
  - [ ] Opinionated
  - [ ] Authority
- [ ] Copy-to-clipboard works
- [ ] Error handling works (failed generation)
- [ ] Partial success handling works (some platforms fail)

#### Quota & Usage
- [ ] Free tier quota enforced (10/month)
- [ ] Usage counter increments correctly
- [ ] Quota exceeded message shows
- [ ] Usage stats display correctly
- [ ] Monthly reset logic works

#### Subscription Flow
- [ ] Checkout session creation works
- [ ] Stripe redirect works
- [ ] Subscription activation works
- [ ] User tier upgraded correctly
- [ ] Quota limit increased correctly
- [ ] Customer portal access works
- [ ] Subscription cancellation works
- [ ] Downgrade to free tier works

#### API Endpoints
- [ ] `POST /api/generate` - Generation works
- [ ] `GET /api/history` - History retrieval works
- [ ] `GET /api/usage` - Usage stats work
- [ ] `POST /api/webhooks/stripe` - Webhook processing works
- [ ] `POST /api/webhooks/clerk` - Webhook processing works

### 9. Performance Testing

- [ ] Generation completes in < 10 seconds
- [ ] Parallel platform generation works
- [ ] Page load times < 2 seconds
- [ ] Database queries optimized
- [ ] No N+1 query issues
- [ ] Redis caching working
- [ ] Rate limiting not too aggressive

### 10. Security Testing

- [ ] Authentication required for all protected routes
- [ ] API routes validate Clerk tokens
- [ ] Webhook signatures verified
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Prompt injection sanitization working
- [ ] Environment variables not exposed to client
- [ ] HTTPS enforced in production
- [ ] CORS configured correctly

## Deployment

### 11. Pre-Deployment Checklist

- [ ] All environment variables documented
- [ ] `.env.example` up to date
- [ ] README.md complete
- [ ] Database schema migrations ready
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Build succeeds locally (`npm run build`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Git repository clean (no sensitive files)
- [ ] `.gitignore` properly configured

### 12. Vercel Deployment

- [ ] Project imported to Vercel
- [ ] Build settings verified:
  - Build command: `npm run build`
  - Output directory: `.next`
  - Install command: `npm install`
- [ ] Environment variables added to Vercel:
  - [ ] All production keys and secrets
  - [ ] `NODE_ENV=production`
  - [ ] Database URLs
  - [ ] API keys
  - [ ] Webhook secrets
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate verified
- [ ] Initial deployment successful
- [ ] Production site loads correctly

### 13. Post-Deployment Verification

- [ ] Production site accessible
- [ ] User sign-up works in production
- [ ] Generation works in production
- [ ] Database connections stable
- [ ] Webhooks receiving events:
  - [ ] Clerk webhooks working
  - [ ] Stripe webhooks working
- [ ] Stripe test mode → live mode:
  - [ ] Live mode keys added
  - [ ] Products recreated in live mode
  - [ ] Webhook endpoint updated to live mode
  - [ ] Test payment processed successfully
- [ ] Error tracking receiving events (Sentry)
- [ ] Analytics tracking events (PostHog)
- [ ] Performance metrics acceptable

## Go-Live

### 14. Launch Preparation

#### Legal & Compliance
- [ ] Privacy Policy created
- [ ] Terms of Service created
- [ ] Cookie policy (if applicable)
- [ ] GDPR compliance verified (if EU users)
- [ ] Refund policy defined

#### Billing & Pricing
- [ ] Stripe in live mode
- [ ] Pricing finalized:
  - [ ] Free: 10 generations/month
  - [ ] Pro: $19-29/month
  - [ ] Business: $49/month
- [ ] Payment methods tested
- [ ] Tax handling configured (Stripe Tax)
- [ ] Invoice emails configured

#### Content & Marketing
- [ ] Landing page ready
- [ ] Product screenshots/demos ready
- [ ] Social media accounts created (optional)
- [ ] Support email configured
- [ ] Help documentation (optional)

### 15. Launch Day

- [ ] Final production testing completed
- [ ] Monitoring dashboards ready
- [ ] Support email monitored
- [ ] Error alerts configured
- [ ] Team briefed on support procedures

### 16. Post-Launch Monitoring (First 48 Hours)

- [ ] Monitor error rates (Sentry)
- [ ] Monitor user sign-ups
- [ ] Monitor generation success rates
- [ ] Monitor API response times
- [ ] Monitor database performance
- [ ] Monitor LLM API usage and costs
- [ ] Check for any critical bugs
- [ ] Respond to user feedback
- [ ] Monitor Stripe transactions

## Ongoing Maintenance

### 17. Weekly Tasks

- [ ] Review error logs
- [ ] Check API usage and costs
- [ ] Monitor user growth
- [ ] Review generation quality
- [ ] Check database performance
- [ ] Respond to user support requests

### 18. Monthly Tasks

- [ ] Review analytics
- [ ] Check LLM costs vs revenue
- [ ] Database backup verification
- [ ] Security updates
- [ ] Dependency updates
- [ ] User feedback review
- [ ] Feature request prioritization

### 19. Growth & Scaling

When ready:
- [ ] Add custom tone training
- [ ] Add generation history search
- [ ] Add team accounts
- [ ] Add API access
- [ ] Add integrations (Zapier, etc.)
- [ ] Add analytics dashboard
- [ ] Scale database (read replicas)
- [ ] Scale LLM infrastructure
- [ ] Add CDN for static assets

## Success Metrics

### Key Metrics to Track

**User Metrics:**
- Daily/Monthly Active Users (DAU/MAU)
- Sign-up conversion rate
- Free-to-paid conversion rate
- Churn rate
- Average generations per user

**Product Metrics:**
- Generation success rate (target: >95%)
- Average generation time (target: <10s)
- Platform-specific quality scores
- Error rate (target: <1%)
- API uptime (target: 99.9%)

**Business Metrics:**
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- LLM costs per generation
- Gross margin

**Technical Metrics:**
- API response times
- Database query performance
- Error rates
- LLM token usage
- Infrastructure costs

## Emergency Procedures

### Critical Issues

**Site Down:**
1. Check Vercel status
2. Check database connection
3. Review error logs in Sentry
4. Check DNS configuration
5. Post status update

**Payment Issues:**
1. Check Stripe dashboard
2. Verify webhook delivery
3. Check webhook signature
4. Review error logs
5. Contact Stripe support if needed

**LLM Provider Down:**
1. Automatic failover should activate
2. Monitor fallback provider
3. Check costs on fallback
4. Communicate with users if needed

**Database Issues:**
1. Check Supabase status
2. Review connection pool
3. Check query performance
4. Consider read replicas
5. Contact Supabase support

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Clerk Docs**: https://clerk.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **OpenAI Docs**: https://platform.openai.com/docs
- **Anthropic Docs**: https://docs.anthropic.com

---

## Final Pre-Launch Checklist

Before announcing to the public:

- [ ] ✅ All critical features working
- [ ] ✅ All tests passing
- [ ] ✅ Production environment stable
- [ ] ✅ Monitoring in place
- [ ] ✅ Support process defined
- [ ] ✅ Legal documents in place
- [ ] ✅ Payment processing tested
- [ ] ✅ Pricing finalized
- [ ] ✅ Team ready for support
- [ ] ✅ Emergency procedures documented

**Ready to launch!** 🚀
