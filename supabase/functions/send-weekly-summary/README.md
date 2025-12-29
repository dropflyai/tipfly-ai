# Weekly Summary Email Function

Sends personalized weekly tip summaries to users via Resend email service.

## Features

- Weekly earnings summary with stats (total tips, hours, avg per hour)
- Week-over-week comparison (% change)
- Current streak status
- Best performing day highlight
- Top shift type analysis
- Beautiful HTML email with TipFly branding

## Setup

### 1. Environment Variables

Set these in your Supabase project settings or via CLI:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxx
```

The following are automatically available:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. Deploy the Function

```bash
supabase functions deploy send-weekly-summary
```

### 3. Set Up Cron Job

Use Supabase's pg_cron extension to schedule the function:

```sql
-- Enable pg_cron extension (run once)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly summary for Monday at 9 AM UTC
SELECT cron.schedule(
  'weekly-summary-email',
  '0 9 * * 1', -- Every Monday at 9 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-weekly-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Alternatively**, use an external cron service like:
- Vercel Cron Jobs
- GitHub Actions scheduled workflows
- AWS CloudWatch Events

### 4. Database Requirements

Run the migration to add required columns:

```sql
-- profiles table needs:
-- - notification_preferences JSONB (with weekly_summary boolean)
-- - email_verified BOOLEAN

-- weekly_summary_log table for tracking sent emails
```

## API

### POST /functions/v1/send-weekly-summary

#### Request Body (optional)

```json
{
  "userId": "uuid"  // Optional: Send to specific user only
}
```

#### Response

```json
{
  "success": true,
  "weekRange": "Dec 16 - Dec 22",
  "processed": 100,
  "sent": 85,
  "skipped": 10,
  "failed": 5,
  "results": [
    { "userId": "...", "success": true },
    { "userId": "...", "success": true, "error": "No tips this week" }
  ]
}
```

## Email Content

The email includes:
- Total tips earned with week-over-week change
- Number of tips logged
- Total hours worked
- Average earnings per hour
- Top performing shift type
- Current logging streak
- Best day of the week

## User Preferences

Users can opt out via:
- Setting `notification_preferences.weekly_summary = false` in profiles
- Using the Notifications settings in the app

## Testing

Send a test email to a specific user:

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-weekly-summary' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "YOUR_USER_ID"}'
```

## Monitoring

Check the `weekly_summary_log` table for sent email history:

```sql
SELECT * FROM weekly_summary_log
ORDER BY sent_at DESC
LIMIT 10;
```
