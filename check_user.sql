SELECT id, email, clerk_user_id, subscription_tier, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
