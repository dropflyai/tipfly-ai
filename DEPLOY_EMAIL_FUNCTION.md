# Quick Deploy Guide - Email Verification Function

Since you're on Windows, the easiest way to deploy the Edge Function is through the Supabase Dashboard.

## Step 1: Add Resend API Key to Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your TipGenius project
3. Go to **Project Settings** (gear icon) → **Edge Functions** → **Manage secrets**
4. Click **Add new secret**
5. Add:
   - Name: `RESEND_API_KEY`
   - Value: `re_HhvjMD5E_EF74kqYScLGvp1r4rNvC3Kip`
6. Click **Save**

## Step 2: Deploy the Edge Function via Dashboard

### Option A: Using Supabase Dashboard (Recommended for Windows)

1. In your Supabase Dashboard, go to **Edge Functions** (in the left sidebar)
2. Click **Create a new function**
3. Name it: `send-verification-email`
4. Copy the entire contents from: `tip-genius-app/supabase/functions/send-verification-email/index.ts`
5. Paste it into the function editor
6. Click **Deploy**

### Option B: Using npx (Alternative)

If you want to use CLI without installing globally:

```bash
cd /c/Users/escot/tip-genius-app

# Login to Supabase
npx supabase login

# Link your project (get project ref from dashboard URL)
npx supabase link --project-ref YOUR_PROJECT_REF

# Set the secret
npx supabase secrets set RESEND_API_KEY=re_HhvjMD5E_EF74kqYScLGvp1r4rNvC3Kip

# Deploy the function
npx supabase functions deploy send-verification-email
```

## Step 3: Verify Deployment

After deploying, test the function:

1. In Supabase Dashboard → **Edge Functions** → **send-verification-email**
2. Click the **Invoke** tab
3. Add this test payload:
   ```json
   {
     "email": "escott1188@gmail.com"
   }
   ```
4. Click **Invoke function**
5. Check your email inbox (and spam folder) for the verification email

## Step 4: Set Up Resend Domain (Optional but Recommended)

For production, you should verify your domain in Resend:

1. Go to https://resend.com/domains
2. Click **Add Domain**
3. Enter your domain: `tipgenius.app` (or whatever domain you're using)
4. Add the DNS records to your domain provider:
   - **SPF Record**: Add the TXT record they provide
   - **DKIM Record**: Add the TXT record they provide
   - **DMARC Record**: Add the TXT record they provide
5. Wait for verification (usually takes a few minutes)
6. Update the Edge Function to use your domain:
   - Change `from: 'TipGenius <noreply@tipgenius.app>'`
   - Redeploy the function

### For Testing Without Domain

If you haven't set up a domain yet:
- Resend will work in "sandbox mode"
- Emails will only be sent to verified email addresses
- Go to https://resend.com/settings/emails
- Add and verify `escott1188@gmail.com`
- Test emails will work, but production won't until you verify a domain

## Troubleshooting

### Function Not Found Error in App

If the app shows "Function not found":
1. Make sure the function is deployed and showing in Supabase Dashboard → Edge Functions
2. Check that the function name matches exactly: `send-verification-email`
3. Wait a minute after deployment for it to propagate

### Email Not Sending

Check the Edge Function logs:
1. Supabase Dashboard → Edge Functions → send-verification-email
2. Click the **Logs** tab
3. Look for errors

Common issues:
- **API key incorrect**: Double-check the Resend API key in secrets
- **Email not verified**: In sandbox mode, recipient must be verified in Resend
- **Rate limit**: Resend free tier has limits, wait a bit and try again

### CORS Errors

If you get CORS errors from the app:
- The function already has CORS headers configured
- Make sure you're calling it from the same domain as your Supabase project
- Check that the function is deployed correctly

## View Sent Emails

To see all sent emails:
1. Go to https://resend.com/emails
2. You'll see delivery status, opens, etc.
3. Click on any email to see details

## Next Steps

Once the function is deployed and working:
1. Test it in your app by clicking "Resend Verification Email"
2. Check the app logs for the Edge Function response
3. Verify the email arrives with your custom template
4. Set up your domain in Resend for production use

## Quick Reference

- **Function Name**: `send-verification-email`
- **Resend API Key**: `re_HhvjMD5E_EF74kqYScLGvp1r4rNvC3Kip`
- **Secret Name in Supabase**: `RESEND_API_KEY`
- **Function File**: `supabase/functions/send-verification-email/index.ts`

---

Need help? The full setup guide with more details is in [EMAIL_VERIFICATION_SETUP.md](EMAIL_VERIFICATION_SETUP.md)
