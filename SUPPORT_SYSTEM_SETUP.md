# Support System Setup Guide

The support system is now integrated! Here's how to complete the setup:

## Step 1: Create Discord Webhook

1. Go to your Discord server (or create a new one for TipFly AI support)
2. Go to Server Settings → Integrations → Webhooks
3. Click "New Webhook"
4. Name it "TipFly AI Support"
5. Choose the channel where you want support tickets to appear
6. Click "Copy Webhook URL"
7. Add the URL to your `.env` file:
   ```
   EXPO_PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
   ```
8. Restart the Expo server for the environment variable to take effect

## Step 2: Create Database Table

Run this SQL in your Supabase SQL Editor:

```bash
# The SQL file is at: tip-genius-app/supabase/create_support_tickets.sql
```

Or copy/paste the contents of `supabase/create_support_tickets.sql` into the Supabase SQL Editor and run it.

## Step 3: Test the Support Flow

1. Open the app on your device
2. Go to Profile tab → Contact Support
3. Fill out the form and submit
4. Check your Discord channel for the notification
5. Check Supabase → Table Editor → support_tickets to see the saved ticket

## Features Included

### ContactSupportScreen
- **Category Selection**: Bug Report, Feature Request, Need Help, Billing, Other
- **Subject & Message**: Text inputs with character limits
- **User Info Auto-Filled**: Email and name from user profile
- **Discord Notifications**: Real-time alerts to your Discord channel
- **Database Storage**: All tickets saved for review in Supabase

### Discord Webhook Format
Each ticket creates a rich embed with:
- 📋 Subject
- 💬 Message (truncated if over 1024 chars)
- 👤 User name
- 📧 Email
- 🏷️ Category
- ⚠️ Priority
- 🆔 Ticket ID
- 🕐 Timestamp

### Database Schema
- `id`: Unique ticket ID
- `user_id`: Link to user who submitted
- `subject`: Ticket subject
- `message`: Full message content
- `status`: open, in_progress, resolved, closed
- `priority`: low, medium, high, urgent
- `category`: User-selected category
- `user_email`, `user_name`: Contact info
- `created_at`, `updated_at`: Timestamps

### Row Level Security
- Users can only view/create/update their own tickets
- Admins (you) can view all via Supabase dashboard

## Future Enhancements

You can later add:
- Admin dashboard to view and respond to tickets
- Email notifications to users when tickets are updated
- In-app ticket history view
- Status updates and responses
- Attachment support
- Priority escalation

## Navigation Flow

Settings → Contact Support → Fill Form → Submit → Success → Auto-close

The "Contact Support" button is in the Profile/Settings screen under the Support section.
