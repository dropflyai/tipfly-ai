-- Run this in Supabase SQL Editor to make your account premium for testing
-- This will allow you to test all premium features

UPDATE users
SET subscription_tier = 'premium'
WHERE email = 'erik.scott.life@gmail.com';

-- Or if using your other email:
UPDATE users
SET subscription_tier = 'premium'
WHERE email = 'escott1188@gmail.com';

-- Verify the change:
SELECT id, email, full_name, subscription_tier, onboarding_completed
FROM users
WHERE email IN ('erik.scott.life@gmail.com', 'escott1188@gmail.com');
