# RepurposeFlow - System Architecture

## 1. HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  Next.js 14+ (App Router) + React + Tailwind CSS               │
│  - Server Components (default)                                  │
│  - Client Components (interactive UI)                           │
│  - Server Actions (mutations)                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  Next.js API Routes + Server Actions                            │
│  - Authentication Middleware (Clerk)                            │
│  - Rate Limiting Middleware                                     │
│  - Input Validation & Sanitization                             │
│  - Error Handling & Logging                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Prompt Engine   │  │  Billing Service │  │  Usage Tracker│ │
│  │  - Analyzer      │  │  - Stripe API    │  │  - Quotas     │ │
│  │  - Generators    │  │  - Webhooks      │  │  - Limits     │ │
│  │  - Orchestrator  │  └──────────────────┘  └───────────────┘ │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  OpenAI/     │  │  PostgreSQL  │  │  Clerk Auth        │   │
│  │  Claude API  │  │  (Supabase)  │  │                    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 2. CORE COMPONENTS

### 2.1 Prompt Engine (Brain of the System)

**Architecture Pattern**: Pipeline with Parallel Execution

```
Input Content
     ↓
[STAGE 1: Content Analysis]
- Extract core message (1-2 key ideas)
- Identify topic, audience, tone
- Extract key points (3-5 main points)
- Return structured JSON
     ↓
[STAGE 2: Parallel Platform Generation]
├─→ TikTok/Reels Generator
├─→ Twitter/X Thread Generator
├─→ Threads Generator
├─→ LinkedIn Generator
├─→ Instagram Generator
└─→ Email Newsletter Generator
     ↓
[STAGE 3: Output Assembly]
- Validate all outputs
- Ensure consistency with core message
- Return unified response
```

**Key Features**:
- **Provider Abstraction**: Supports OpenAI or Claude via adapter pattern
- **Prompt Templates**: Version-controlled, platform-specific prompts
- **Core Message Lock**: Ensures all outputs align with extracted main ideas
- **Parallel Execution**: Uses Promise.allSettled() for speed
- **Error Recovery**: Individual platform failures don't crash entire generation

### 2.2 Authentication & Authorization

**Provider**: Clerk
- Social auth (Google, GitHub)
- Email/password
- Session management
- Middleware protection for all authenticated routes

**Flow**:
1. User signs up → Clerk creates user
2. Webhook → Create user record in PostgreSQL
3. Assign default tier (Free)
4. Track usage from first generation

### 2.3 Billing & Subscription

**Provider**: Stripe
- Subscription billing (monthly/annual)
- Usage-based metering (optional)
- Webhook handling for subscription events

**Tiers**:
- **Free**: 10 generations/month
- **Pro** ($19/mo): 500 generations/month
- **Business** ($49/mo): Unlimited generations

**Implementation**:
- Stripe Customer Portal for self-service
- Webhook handlers for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

### 2.4 Usage Tracking

**Strategy**: Atomic counters with reset logic

```typescript
// Before generation
const canGenerate = await checkUserQuota(userId);
if (!canGenerate) throw new QuotaExceededError();

// After successful generation
await incrementUsage(userId, platformCount);

// Monthly reset (cron job)
await resetMonthlyUsage(); // Runs on 1st of each month
```

**Tracking**:
- Generations count per user per month
- Last generation timestamp
- Platform breakdown (analytics)

## 3. DATA FLOW

### Generation Request Flow

```
1. User submits content + platforms + tone
   ↓
2. Middleware: Auth check → Rate limit → Quota check
   ↓
3. Input validation & sanitization
   ↓
4. Call Prompt Engine:
   a. Analyze content (1 LLM call)
   b. Generate platforms (N parallel LLM calls)
   ↓
5. Save generation to database
   ↓
6. Increment usage counter
   ↓
7. Return results to client
   ↓
8. Client displays outputs with copy buttons
```

## 4. SECURITY ARCHITECTURE

### 4.1 API Key Protection
- Environment variables only (never in client code)
- Server-side execution only
- Key rotation support

### 4.2 Prompt Injection Prevention
```typescript
// Input sanitization
- Strip HTML tags
- Limit length (max 10,000 chars)
- Detect and reject system prompt attempts
- Character whitelist validation

// Prompt construction
- Use structured JSON outputs
- Separate user content from instructions
- No dynamic prompt composition from user input
```

### 4.3 Rate Limiting
- Per-user: 10 requests per minute
- Per-IP: 20 requests per minute
- Global: 1000 requests per minute

**Implementation**: Upstash Redis or Vercel KV

### 4.4 Authentication Security
- All app routes require authentication
- API routes validate Clerk session tokens
- CSRF protection via SameSite cookies
- No public API endpoints

## 5. PERFORMANCE OPTIMIZATION

### 5.1 Parallel LLM Calls
```typescript
const [analysis] = await analyzeContent(input);

const results = await Promise.allSettled([
  generateTikTok(analysis, tone),
  generateTwitter(analysis, tone),
  generateThreads(analysis, tone),
  generateLinkedIn(analysis, tone),
  generateInstagram(analysis, tone),
  generateEmail(analysis, tone),
]);
```

**Expected Times**:
- Content analysis: 2-4 seconds
- Parallel generation: 3-6 seconds
- **Total**: 5-10 seconds for all platforms

### 5.2 Caching Strategy
- Cache analysis results (same content = same analysis)
- Cache key: SHA-256 hash of input content
- TTL: 24 hours
- Storage: Redis/Vercel KV

### 5.3 Edge Deployment
- Deploy to Vercel Edge Network
- API routes run on Edge Runtime where possible
- Database connection pooling (Supabase Pooler)

## 6. ERROR HANDLING

### 6.1 Error Types
```typescript
- QuotaExceededError → 429 with upgrade CTA
- InvalidInputError → 400 with specific message
- LLMProviderError → 503 with retry logic
- AuthenticationError → 401 redirect to login
- RateLimitError → 429 with retry-after header
```

### 6.2 Graceful Degradation
- If 1 platform fails, others still succeed
- Show partial results with error message
- Allow retry for failed platforms only

### 6.3 Logging & Monitoring
- Error tracking: Sentry or similar
- Performance monitoring: Vercel Analytics
- User analytics: PostHog or Mixpanel
- Log levels:
  - ERROR: LLM failures, payment failures
  - WARN: Rate limits, quota warnings
  - INFO: Successful generations, sign-ups

## 7. SCALABILITY CONSIDERATIONS

### 7.1 Database
- Connection pooling (PgBouncer via Supabase)
- Indexes on: user_id, created_at, subscription_tier
- Partition generations table by month (future)

### 7.2 LLM Provider
- Multi-provider support (OpenAI + Claude)
- Automatic failover
- Load balancing between providers
- Cost optimization (use cheaper models for analysis)

### 7.3 Horizontal Scaling
- Stateless API design
- Redis for shared state (rate limits, cache)
- Database read replicas for analytics

## 8. DEPLOYMENT ARCHITECTURE

### Recommended Stack
```
┌─────────────────────────────────────┐
│  Vercel (Frontend + API Routes)    │
│  - Automatic HTTPS                  │
│  - Edge Network                     │
│  - Automatic scaling                │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Supabase (PostgreSQL + Auth)      │
│  - Managed database                 │
│  - Automatic backups                │
│  - Connection pooling               │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  External Services                  │
│  - Clerk (Auth)                     │
│  - Stripe (Billing)                 │
│  - OpenAI/Claude (LLM)              │
│  - Upstash Redis (Cache)            │
└─────────────────────────────────────┘
```

### Environment Variables
```bash
# Core
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://repurposeflow.com

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://... # For migrations

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LLM_PROVIDER=openai # or anthropic

# Billing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_BUSINESS=price_...

# Rate Limiting & Cache
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Monitoring
SENTRY_DSN=https://...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

## 9. MVP vs. FUTURE FEATURES

### MVP (Launch Ready)
✅ Core generation for 6 platforms
✅ 3 tone presets
✅ Free + Pro tier
✅ Generation history (30 days)
✅ Copy to clipboard
✅ Mobile responsive UI
✅ Basic analytics (user-level)

### Future Enhancements
⏳ Custom tone training (user uploads examples)
⏳ Bulk generation (CSV upload)
⏳ Team accounts
⏳ API access for integrations
⏳ Chrome extension
⏳ Content calendar integration
⏳ A/B testing for outputs
⏳ Brand voice presets (upload brand guidelines)
⏳ Webhook notifications

## 10. CRITICAL SUCCESS FACTORS

1. **Speed**: Users get results in < 10 seconds
2. **Quality**: Outputs are genuinely platform-specific, not generic
3. **Reliability**: 99.9% uptime, graceful error handling
4. **Pricing**: Clear value prop vs. ChatGPT ($20/mo)
5. **Onboarding**: First generation in < 2 minutes from signup
6. **Mobile UX**: Works perfectly on phones (where creators are)

## 11. COMPETITIVE DIFFERENTIATION

**vs. ChatGPT**:
- No prompt engineering needed
- Parallel multi-platform output
- Platform-specific optimization
- Consistent brand voice
- Usage tracking & history

**vs. Jasper/Copy.ai**:
- Niche focus (repurposing, not creation)
- Simpler, faster UX
- Better pricing for creators
- Core message consistency

**vs. Notion AI**:
- Dedicated workflow
- Better platform knowledge
- More output formats
- Standalone tool
