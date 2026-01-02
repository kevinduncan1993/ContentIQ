# RepurposeFlow - Database Schema

## Overview

PostgreSQL database optimized for fast writes and efficient querying of user data and generation history.

## Entity Relationship Diagram (Textual)

```
users (1) ───< (N) generations
  │
  │
  └─────< (N) usage_logs
  │
  │
  └─────< (1) subscriptions
```

## Schema Definition

### 1. users

Stores user profile and subscription information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL, -- Clerk external ID
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),

  -- Subscription
  subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free', -- 'free', 'pro', 'business'
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trialing'
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255),
  subscription_current_period_end TIMESTAMP WITH TIME ZONE,

  -- Usage tracking
  generations_count_current_month INTEGER NOT NULL DEFAULT 0,
  generations_limit INTEGER NOT NULL DEFAULT 10, -- Based on tier
  last_generation_at TIMESTAMP WITH TIME ZONE,
  usage_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', NOW() + INTERVAL '1 month'),

  -- Preferences
  default_tone VARCHAR(50) DEFAULT 'conversational', -- 'educational', 'conversational', 'opinionated', 'authority'

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Indexes
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Quota Limits by Tier**:
- `free`: 10 generations/month
- `pro`: 500 generations/month
- `business`: 999999 (effectively unlimited)

### 2. generations

Stores all content generation requests and outputs.

```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Input
  input_content TEXT NOT NULL,
  input_content_hash VARCHAR(64) NOT NULL, -- SHA-256 for deduplication/caching
  selected_platforms TEXT[] NOT NULL, -- ['tiktok', 'twitter', 'linkedin', etc.]
  selected_tone VARCHAR(50) NOT NULL,

  -- Analysis output
  core_message TEXT,
  key_points JSONB, -- Array of extracted key points
  detected_topic VARCHAR(255),
  detected_audience VARCHAR(255),

  -- Platform outputs (JSONB for flexibility)
  output_tiktok JSONB, -- { content: "...", cta: "...", hooks: [...] }
  output_twitter JSONB, -- { thread: [...], hashtags: [...] }
  output_threads JSONB,
  output_linkedin JSONB,
  output_instagram JSONB,
  output_email JSONB,

  -- Metadata
  generation_time_ms INTEGER, -- Performance tracking
  llm_provider VARCHAR(50), -- 'openai', 'anthropic'
  llm_model VARCHAR(100), -- 'gpt-4', 'claude-3-opus', etc.
  total_tokens_used INTEGER,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'partial'
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_input_hash ON generations(input_content_hash);
CREATE INDEX idx_generations_user_created ON generations(user_id, created_at DESC);

-- Composite index for user's recent history
CREATE INDEX idx_generations_user_recent ON generations(user_id, created_at DESC)
  WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days';
```

**Output JSON Structure Examples**:

```json
// output_tiktok
{
  "hooks": [
    "Here's why everyone gets this wrong...",
    "I tried this for 30 days and here's what happened...",
    "Stop doing X. Do this instead."
  ],
  "talking_points": [
    "Point 1 with specific example",
    "Point 2 with specific example",
    "Point 3 with specific example"
  ],
  "cta": "Follow for more content tips",
  "hashtags": ["#contentcreator", "#tiktokmarketing"]
}

// output_twitter
{
  "thread": [
    "1/ Thread opener with hook",
    "2/ First main point with context",
    "3/ Second main point with data",
    "4/ Third point with example",
    "5/ Conclusion with CTA"
  ],
  "tweet_count": 5,
  "hashtags": ["#contentmarketing", "#creatoreconomy"]
}

// output_linkedin
{
  "post": "Full LinkedIn post with formatting...",
  "opening_hook": "First sentence that grabs attention",
  "cta": "What's your experience with this?",
  "hashtags": ["#B2B", "#ContentStrategy"]
}
```

### 3. usage_logs

Detailed usage tracking for analytics and debugging.

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,

  -- Event tracking
  event_type VARCHAR(50) NOT NULL, -- 'generation_started', 'generation_completed', 'generation_failed'
  platform_count INTEGER NOT NULL, -- Number of platforms requested
  platforms TEXT[], -- Which platforms

  -- Cost tracking
  tokens_used INTEGER,
  estimated_cost_usd DECIMAL(10, 6), -- Track LLM API costs

  -- Metadata
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_event_type ON usage_logs(event_type);

-- Partitioning (for large scale)
-- Future: Partition by month for better performance
```

### 4. subscriptions

Tracks subscription history and billing events (mirroring Stripe data).

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Stripe data
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,

  -- Subscription details
  tier VARCHAR(50) NOT NULL, -- 'pro', 'business'
  status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing', 'incomplete'

  -- Billing cycle
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Pricing
  amount_cents INTEGER NOT NULL, -- Price in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  interval VARCHAR(20) NOT NULL, -- 'month', 'year'

  -- Trial
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 5. webhook_events

Logs all incoming webhooks for debugging and replay capability.

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source
  source VARCHAR(50) NOT NULL, -- 'stripe', 'clerk'
  event_type VARCHAR(255) NOT NULL, -- e.g., 'customer.subscription.updated'
  event_id VARCHAR(255) UNIQUE NOT NULL, -- External event ID for idempotency

  -- Payload
  payload JSONB NOT NULL,

  -- Processing
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhook_events_source ON webhook_events(source);
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);
```

## Database Functions & Triggers

### Auto-update updated_at timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Increment user generation count

```sql
CREATE OR REPLACE FUNCTION increment_user_generation_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE users
    SET
      generations_count_current_month = generations_count_current_month + 1,
      last_generation_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_generation_count_on_complete
  AFTER UPDATE ON generations
  FOR EACH ROW
  EXECUTE FUNCTION increment_user_generation_count();
```

### Check user quota before generation

```sql
CREATE OR REPLACE FUNCTION check_user_quota(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_limit INTEGER;
  v_reset_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT
    generations_count_current_month,
    generations_limit,
    usage_reset_at
  INTO v_count, v_limit, v_reset_at
  FROM users
  WHERE id = p_user_id;

  -- Reset if past reset date
  IF v_reset_at < NOW() THEN
    UPDATE users
    SET
      generations_count_current_month = 0,
      usage_reset_at = date_trunc('month', NOW() + INTERVAL '1 month')
    WHERE id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Check quota
  RETURN v_count < v_limit;
END;
$$ LANGUAGE plpgsql;
```

### Update user tier and limits

```sql
CREATE OR REPLACE FUNCTION update_user_tier(
  p_user_id UUID,
  p_tier VARCHAR(50)
)
RETURNS VOID AS $$
DECLARE
  v_new_limit INTEGER;
BEGIN
  -- Set limit based on tier
  v_new_limit := CASE p_tier
    WHEN 'free' THEN 10
    WHEN 'pro' THEN 500
    WHEN 'business' THEN 999999
    ELSE 10
  END;

  UPDATE users
  SET
    subscription_tier = p_tier,
    generations_limit = v_new_limit
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

## Seeding & Migrations

### Initial migration order

```bash
1. Create users table
2. Create generations table
3. Create usage_logs table
4. Create subscriptions table
5. Create webhook_events table
6. Create functions and triggers
7. Create indexes
```

### Seed data for development

```sql
-- Insert test user
INSERT INTO users (
  clerk_user_id,
  email,
  full_name,
  subscription_tier,
  generations_limit
) VALUES (
  'user_test123',
  'test@example.com',
  'Test User',
  'pro',
  500
);
```

## Performance Considerations

### 1. Indexing Strategy
- All foreign keys are indexed
- Composite indexes for common query patterns
- Partial indexes for recent data (30-day window)

### 2. Partitioning (Future)
When `generations` table exceeds 1M rows:
```sql
-- Partition by month
CREATE TABLE generations_y2024m01 PARTITION OF generations
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 3. Archiving
Archive generations older than 90 days to cold storage:
```sql
-- Move to archive table
INSERT INTO generations_archive
SELECT * FROM generations
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM generations
WHERE created_at < NOW() - INTERVAL '90 days';
```

### 4. Query Optimization

```sql
-- Efficient user history query
SELECT
  id,
  selected_platforms,
  selected_tone,
  created_at,
  status
FROM generations
WHERE user_id = $1
  AND created_at > NOW() - INTERVAL '30 days'
  AND status = 'completed'
ORDER BY created_at DESC
LIMIT 50;

-- Efficient quota check
SELECT
  generations_count_current_month < generations_limit AS can_generate,
  generations_limit - generations_count_current_month AS remaining
FROM users
WHERE id = $1;
```

## Data Retention Policy

- **User data**: Retained indefinitely (or until user deletion)
- **Generations**: 30 days active, 90 days total, then archived
- **Usage logs**: 90 days, then aggregated
- **Webhook events**: 30 days, then deleted
- **Subscriptions**: Retained indefinitely for billing history

## Backup Strategy

1. **Continuous**: Supabase automatic backups (Point-in-Time Recovery)
2. **Daily**: Full database backup to S3
3. **Weekly**: Backup verification and restore test
4. **Retention**: 30 daily backups, 12 weekly backups

## Security

### Row-Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own data
CREATE POLICY users_select_own ON users
  FOR SELECT USING (clerk_user_id = current_setting('app.current_user_id'));

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (clerk_user_id = current_setting('app.current_user_id'));

-- Users can only read their own generations
CREATE POLICY generations_select_own ON generations
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = current_setting('app.current_user_id')
    )
  );

-- Users can only read their own usage logs
CREATE POLICY usage_logs_select_own ON usage_logs
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_user_id = current_setting('app.current_user_id')
    )
  );
```

### Data encryption
- All data encrypted at rest (Supabase default)
- SSL/TLS for all connections
- Sensitive fields (email) can be additionally encrypted with application-level encryption

## Monitoring Queries

```sql
-- Active subscriptions by tier
SELECT
  subscription_tier,
  COUNT(*) as user_count,
  SUM(generations_count_current_month) as total_generations
FROM users
WHERE subscription_status = 'active'
GROUP BY subscription_tier;

-- Daily generation volume
SELECT
  DATE(created_at) as date,
  COUNT(*) as generations,
  COUNT(DISTINCT user_id) as active_users
FROM generations
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Platform popularity
SELECT
  platform,
  COUNT(*) as usage_count
FROM (
  SELECT unnest(selected_platforms) as platform
  FROM generations
  WHERE created_at > NOW() - INTERVAL '7 days'
) platforms
GROUP BY platform
ORDER BY usage_count DESC;

-- Average generation time
SELECT
  AVG(generation_time_ms) as avg_time_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY generation_time_ms) as median_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY generation_time_ms) as p95_time_ms
FROM generations
WHERE created_at > NOW() - INTERVAL '7 days'
  AND status = 'completed';
```
