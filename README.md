# RepurposeFlow

**AI-powered content repurposing for creators.**

Transform your long-form content into platform-specific short-form content in seconds.

## Features

- **Multi-Platform Generation**: Create content for TikTok/Reels, Twitter/X, LinkedIn, Instagram, Threads, and Email simultaneously
- **Tone Customization**: Choose from Educational, Conversational, Opinionated, or Authority tones
- **Core Message Lock**: Ensures consistency across all platforms by extracting and enforcing 1-2 core ideas
- **Fast Generation**: Parallel LLM calls complete in 5-10 seconds
- **Usage Tracking**: Monitor your quota and generation history
- **Subscription Billing**: Free tier and paid plans via Stripe

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **Tailwind CSS**
- **TypeScript**
- **Clerk** (Authentication)

### Backend
- **Next.js API Routes** & Server Actions
- **PostgreSQL** (via Supabase)
- **Drizzle ORM**
- **OpenAI** or **Claude** (LLM providers)
- **Stripe** (Payments)
- **Upstash Redis** (Rate limiting & caching)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- OpenAI or Anthropic API key
- Clerk account
- Stripe account
- Upstash Redis account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd repurposeflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in all required environment variables (see `.env.example`)

4. **Set up database**
   ```bash
   npm run db:push
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for a complete list of required environment variables:

- **Database**: `DATABASE_URL`, `DIRECT_URL`
- **Auth**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- **LLM**: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- **Billing**: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, etc.
- **Cache**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

## Database Setup

### Using Supabase

1. Create a Supabase project
2. Get your connection strings:
   - `DATABASE_URL` (pooled connection with `?pgbouncer=true`)
   - `DIRECT_URL` (direct connection for migrations)
3. Run migrations:
   ```bash
   npm run db:push
   ```

### Schema

The database includes:
- `users` - User profiles and subscription info
- `generations` - Content generation history
- `subscriptions` - Stripe subscription records
- `usage_logs` - Detailed usage tracking
- `webhook_events` - Webhook event logs

See `src/db/schema.ts` for full schema definition.

## API Routes

- `POST /api/generate` - Generate platform-specific content
- `GET /api/history` - Get user's generation history
- `GET /api/usage` - Get user's current quota and usage stats
- `POST /api/webhooks/stripe` - Handle Stripe webhooks
- `POST /api/webhooks/clerk` - Handle Clerk webhooks

## Webhooks

### Clerk Webhooks

Set up webhook endpoint in Clerk dashboard:
- **Endpoint**: `https://yourdomain.com/api/webhooks/clerk`
- **Events**: `user.created`, `user.updated`, `user.deleted`
- **Secret**: Add to `CLERK_WEBHOOK_SECRET`

### Stripe Webhooks

Set up webhook endpoint in Stripe dashboard:
- **Endpoint**: `https://yourdomain.com/api/webhooks/stripe`
- **Events**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- **Secret**: Add to `STRIPE_WEBHOOK_SECRET`

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

Vercel automatically:
- Deploys to Edge Network
- Enables auto-scaling
- Provides SSL/HTTPS
- Integrates with Supabase

### Database Migrations

For production:
```bash
npm run db:push
```

## Project Structure

```
repurposeflow/
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # System architecture
│   └── DATABASE_SCHEMA.md   # Database schema
├── prompts/                 # LLM prompt templates
│   ├── content-analyzer.ts  # Content analysis prompt
│   ├── platform-tiktok.ts   # TikTok/Reels prompts
│   ├── platform-twitter.ts  # Twitter/X prompts
│   ├── platform-linkedin.ts # LinkedIn prompts
│   └── ...
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard page
│   │   └── layout.tsx      # Root layout
│   ├── components/          # React components
│   │   ├── GeneratorInterface.tsx
│   │   ├── PlatformSelector.tsx
│   │   ├── ToneSelector.tsx
│   │   └── OutputPanel.tsx
│   ├── db/                  # Database
│   │   ├── schema.ts       # Drizzle schema
│   │   └── index.ts        # DB client
│   └── lib/                 # Utilities
│       ├── llm/            # LLM provider abstraction
│       ├── prompt-engine.ts # Prompt orchestration
│       ├── rate-limit.ts   # Rate limiting
│       ├── usage.ts        # Usage tracking
│       └── utils.ts        # Helpers
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio

## Subscription Tiers

- **Free**: 10 generations/month
- **Pro**: 500 generations/month - $19/mo
- **Business**: Unlimited generations - $49/mo

Configure prices in Stripe and update environment variables.

## Security

- All routes except `/` require authentication
- API routes validate Clerk session tokens
- Rate limiting per user and IP
- Input sanitization to prevent prompt injection
- Environment variables for all secrets
- Webhook signature verification

## Performance

- Parallel LLM calls for all platforms
- Redis caching for repeated content
- Edge deployment via Vercel
- Database connection pooling
- Optimized database indexes

## Monitoring

Optional integrations:
- **Sentry** - Error tracking
- **PostHog** - Product analytics
- **Vercel Analytics** - Performance monitoring

## Support

For issues or questions:
- Check documentation in `/docs`
- Review architecture: `docs/ARCHITECTURE.md`
- Review schema: `docs/DATABASE_SCHEMA.md`

## License

Proprietary - All rights reserved
