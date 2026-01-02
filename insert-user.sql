-- Run this SQL in Supabase SQL Editor
-- This will create your user account

INSERT INTO users (
  clerk_user_id,
  email,
  full_name,
  subscription_tier,
  subscription_status,
  generations_limit,
  generations_count_current_month,
  usage_reset_at,
  created_at,
  updated_at
) VALUES (
  'user_37gd2dfr23P96ByCLBryyQcRiCT',
  'kevinfinnissee4@gmail.com',
  NULL,
  'free',
  'active',
  10,
  0,
  date_trunc('month', CURRENT_DATE + interval '1 month'),
  NOW(),
  NOW()
)
ON CONFLICT (clerk_user_id) DO NOTHING
RETURNING *;
