// Send Email Verification with Resend
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  email: string;
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get request body
    const { email, userId }: RequestBody = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-verification-email] Sending to:', email);

    // Generate verification link using Supabase Auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate email confirmation link for signup
    const { data: otpData, error: otpError } = await supabaseClient.auth.admin.generateLink({
      type: 'signup',
      email: email,
    });

    if (otpError) {
      console.error('[send-verification-email] OTP generation error:', otpError);
      throw otpError;
    }

    const verificationLink = otpData.properties?.action_link;

    if (!verificationLink) {
      throw new Error('Failed to generate verification link');
    }

    console.log('[send-verification-email] Verification link generated');

    // Send email via Resend
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - TipFly</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0A0E27; color: #FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0E27;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1A1F3A; border-radius: 16px; overflow: hidden;">

          <!-- Header with logo/icon -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);">
              <div style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.2); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 32px;">💰</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF;">Verify Your Email</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: rgba(255,255,255,0.9);">
                Welcome to <strong>TipFly</strong>! We're excited to have you on board.
              </p>

              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 24px; color: rgba(255,255,255,0.9);">
                Please verify your email address to unlock all features including:
              </p>

              <ul style="margin: 0 0 32px 0; padding-left: 20px; font-size: 15px; line-height: 24px; color: rgba(255,255,255,0.8);">
                <li style="margin-bottom: 8px;">📊 Tax-ready reports and exports</li>
                <li style="margin-bottom: 8px;">🎯 Advanced analytics and insights</li>
                <li style="margin-bottom: 8px;">👥 Team pooling features</li>
                <li style="margin-bottom: 8px;">🔒 Secure account protection</li>
              </ul>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 32px 0;">
                    <a href="${verificationLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <div style="padding: 20px; background-color: rgba(99, 102, 241, 0.1); border-left: 4px solid #6366F1; border-radius: 8px; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 14px; line-height: 20px; color: rgba(255,255,255,0.8);">
                  <strong>🔒 Security tip:</strong> This link will expire in 24 hours. If you didn't create a TipFly account, you can safely ignore this email.
                </p>
              </div>

              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 20px; color: rgba(255,255,255,0.7);">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 32px 0; font-size: 13px; word-break: break-all; color: #6366F1;">
                ${verificationLink}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 600;">
                Need help?
              </p>
              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 20px; color: rgba(255,255,255,0.7);">
                Visit our support center or contact us at support@tipfly.app
              </p>
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.5);">
                © ${new Date().getFullYear()} TipFly. All rights reserved.<br>
                Track smarter, earn better.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const emailText = `
Welcome to TipFly!

Please verify your email address to unlock all features.

Verify your email by clicking this link:
${verificationLink}

This link will expire in 24 hours.

If you didn't create a TipFly account, you can safely ignore this email.

Need help? Contact us at support@tipfly.app

© ${new Date().getFullYear()} TipFly. All rights reserved.
Track smarter, earn better.
    `.trim();

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TipFly <noreply@codeflyai.com>',
        to: [email],
        subject: 'Verify Your Email - TipFly',
        html: emailHtml,
        text: emailText,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('[send-verification-email] Resend error:', resendData);
      throw new Error(resendData.message || 'Failed to send email');
    }

    console.log('[send-verification-email] Email sent successfully:', resendData.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification email sent',
        emailId: resendData.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[send-verification-email] Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send verification email',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
