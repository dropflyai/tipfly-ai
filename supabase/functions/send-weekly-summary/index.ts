// Weekly Summary Email Edge Function
// Sends personalized weekly tip summaries to users via Resend
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklyStats {
  userId: string;
  email: string;
  displayName: string;
  totalTips: number;
  totalHours: number;
  tipCount: number;
  avgPerHour: number;
  bestDay: { day: string; amount: number } | null;
  currentStreak: number;
  weekOverWeekChange: number; // percentage
  topShift: string | null;
}

interface TipEntry {
  amount: number;
  hours_worked: number;
  shift_date: string;
  shift_type: string | null;
}

// Get the start of the previous week (Monday)
function getPreviousWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday - 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Get the end of the previous week (Sunday)
function getPreviousWeekEnd(): Date {
  const start = getPreviousWeekStart();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Format date range
function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);
  return `${startStr} - ${endStr}`;
}

// Get day name from date
function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// Generate email HTML
function generateEmailHtml(stats: WeeklyStats, weekRange: string): string {
  const changeColor = stats.weekOverWeekChange >= 0 ? '#22C55E' : '#EF4444';
  const changeIcon = stats.weekOverWeekChange >= 0 ? '↑' : '↓';
  const changeText = stats.weekOverWeekChange >= 0 ? 'up' : 'down';

  const streakSection = stats.currentStreak > 0 ? `
    <tr>
      <td style="padding: 20px; background-color: rgba(255, 152, 0, 0.1); border-radius: 12px; margin-bottom: 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="48" style="vertical-align: top;">
              <div style="font-size: 32px;">🔥</div>
            </td>
            <td style="padding-left: 12px;">
              <p style="margin: 0 0 4px 0; font-size: 18px; font-weight: 700; color: #FF9800;">
                ${stats.currentStreak} Day Streak!
              </p>
              <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">
                Keep it up! Log a tip today to maintain your streak.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td height="16"></td></tr>
  ` : '';

  const bestDaySection = stats.bestDay ? `
    <tr>
      <td style="padding: 16px; background-color: rgba(34, 197, 94, 0.1); border-radius: 12px; border-left: 4px solid #22C55E;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.5px;">
          Best Day
        </p>
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #22C55E;">
          ${stats.bestDay.day}: ${formatCurrency(stats.bestDay.amount)}
        </p>
      </td>
    </tr>
    <tr><td height="16"></td></tr>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly TipFly Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0A0E27; color: #FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0E27;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1A1F3A; border-radius: 16px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 24px 40px; background: linear-gradient(135deg, #00A8E8 0%, #0077B6 100%);">
              <div style="width: 56px; height: 56px; background-color: rgba(255,255,255,0.2); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 28px;">💰</span>
              </div>
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #FFFFFF;">
                Weekly Summary
              </h1>
              <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8);">
                ${weekRange}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 16px 40px;">
              <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.9);">
                Hey ${stats.displayName || 'there'}! Here's how your week went:
              </p>
            </td>
          </tr>

          <!-- Main Stats Card -->
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(0, 168, 232, 0.15) 0%, rgba(0, 119, 182, 0.15) 100%); border-radius: 16px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.5px;">
                      Total Tips Earned
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 42px; font-weight: 800; color: #00A8E8;">
                      ${formatCurrency(stats.totalTips)}
                    </p>
                    ${stats.weekOverWeekChange !== 0 ? `
                    <p style="margin: 0; font-size: 14px; color: ${changeColor};">
                      ${changeIcon} ${Math.abs(stats.weekOverWeekChange).toFixed(1)}% ${changeText} from last week
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Stats Grid -->
          <tr>
            <td style="padding: 24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 16px; background-color: rgba(255,255,255,0.03); border-radius: 12px;">
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: rgba(255,255,255,0.6);">Tips Logged</p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF;">${stats.tipCount}</p>
                  </td>
                  <td width="16"></td>
                  <td width="50%" style="padding: 16px; background-color: rgba(255,255,255,0.03); border-radius: 12px;">
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: rgba(255,255,255,0.6);">Hours Worked</p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF;">${stats.totalHours.toFixed(1)}</p>
                  </td>
                </tr>
                <tr><td height="12" colspan="3"></td></tr>
                <tr>
                  <td width="50%" style="padding: 16px; background-color: rgba(255,255,255,0.03); border-radius: 12px;">
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: rgba(255,255,255,0.6);">Avg Per Hour</p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF;">${formatCurrency(stats.avgPerHour)}</p>
                  </td>
                  <td width="16"></td>
                  <td width="50%" style="padding: 16px; background-color: rgba(255,255,255,0.03); border-radius: 12px;">
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: rgba(255,255,255,0.6);">Top Shift</p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF;">${stats.topShift || 'N/A'}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Streak & Best Day -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${streakSection}
                ${bestDaySection}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding: 0 40px 32px 40px;">
              <a href="tipflyai://dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00A8E8 0%, #0077B6 100%); color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 168, 232, 0.3);">
                Open TipFly
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: rgba(255,255,255,0.5); text-align: center;">
                You're receiving this because you enabled weekly summaries in TipFly.
              </p>
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.4); text-align: center;">
                © ${new Date().getFullYear()} TipFly. Track smarter, earn better.
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
}

// Generate plain text version
function generateEmailText(stats: WeeklyStats, weekRange: string): string {
  const changeText = stats.weekOverWeekChange >= 0
    ? `(+${stats.weekOverWeekChange.toFixed(1)}% from last week)`
    : `(${stats.weekOverWeekChange.toFixed(1)}% from last week)`;

  return `
TipFly Weekly Summary - ${weekRange}

Hey ${stats.displayName || 'there'}! Here's how your week went:

TOTAL TIPS: ${formatCurrency(stats.totalTips)} ${stats.weekOverWeekChange !== 0 ? changeText : ''}

Stats:
- Tips Logged: ${stats.tipCount}
- Hours Worked: ${stats.totalHours.toFixed(1)}
- Avg Per Hour: ${formatCurrency(stats.avgPerHour)}
- Top Shift: ${stats.topShift || 'N/A'}

${stats.currentStreak > 0 ? `🔥 ${stats.currentStreak} Day Streak! Keep it up!\n\n` : ''}
${stats.bestDay ? `Best Day: ${stats.bestDay.day} - ${formatCurrency(stats.bestDay.amount)}\n\n` : ''}

Open TipFly to see more details.

---
You're receiving this because you enabled weekly summaries in TipFly.
© ${new Date().getFullYear()} TipFly. Track smarter, earn better.
  `.trim();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request - can be triggered by cron or manually with specific userId
    let targetUserId: string | null = null;
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      targetUserId = body.userId || null;
    }

    const weekStart = getPreviousWeekStart();
    const weekEnd = getPreviousWeekEnd();
    const weekRange = formatDateRange(weekStart, weekEnd);

    // Get previous week for comparison
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekEnd);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

    console.log(`[weekly-summary] Processing week: ${weekRange}`);

    // Get users who have weekly summary enabled
    // If targetUserId is specified, only process that user
    let usersQuery = supabase
      .from('profiles')
      .select('id, email, display_name, notification_preferences')
      .eq('email_verified', true);

    if (targetUserId) {
      usersQuery = usersQuery.eq('id', targetUserId);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) {
      console.error('[weekly-summary] Error fetching users:', usersError);
      throw usersError;
    }

    const eligibleUsers = (users || []).filter(user => {
      const prefs = user.notification_preferences as Record<string, boolean> | null;
      return prefs?.weekly_summary !== false; // Default to true if not set
    });

    console.log(`[weekly-summary] Found ${eligibleUsers.length} eligible users`);

    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const user of eligibleUsers) {
      try {
        // Get this week's tips
        const { data: tips, error: tipsError } = await supabase
          .from('tip_entries')
          .select('amount, hours_worked, shift_date, shift_type')
          .eq('user_id', user.id)
          .gte('shift_date', weekStart.toISOString().split('T')[0])
          .lte('shift_date', weekEnd.toISOString().split('T')[0]);

        if (tipsError) throw tipsError;

        // Skip if no tips this week
        if (!tips || tips.length === 0) {
          console.log(`[weekly-summary] Skipping ${user.email} - no tips this week`);
          results.push({ userId: user.id, success: true, error: 'No tips this week' });
          continue;
        }

        // Get previous week's tips for comparison
        const { data: prevTips } = await supabase
          .from('tip_entries')
          .select('amount')
          .eq('user_id', user.id)
          .gte('shift_date', prevWeekStart.toISOString().split('T')[0])
          .lte('shift_date', prevWeekEnd.toISOString().split('T')[0]);

        const prevWeekTotal = (prevTips || []).reduce((sum, t) => sum + (t.amount || 0), 0);

        // Get current streak
        const { data: streakData } = await supabase
          .from('user_streaks')
          .select('current_streak')
          .eq('user_id', user.id)
          .single();

        // Calculate stats
        const totalTips = tips.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalHours = tips.reduce((sum, t) => sum + (t.hours_worked || 0), 0);
        const avgPerHour = totalHours > 0 ? totalTips / totalHours : 0;

        // Find best day
        const dayTotals: Record<string, number> = {};
        tips.forEach((tip: TipEntry) => {
          const day = getDayName(tip.shift_date);
          dayTotals[day] = (dayTotals[day] || 0) + (tip.amount || 0);
        });

        let bestDay: { day: string; amount: number } | null = null;
        Object.entries(dayTotals).forEach(([day, amount]) => {
          if (!bestDay || amount > bestDay.amount) {
            bestDay = { day, amount };
          }
        });

        // Find top shift type
        const shiftTotals: Record<string, number> = {};
        tips.forEach((tip: TipEntry) => {
          const shift = tip.shift_type || 'Other';
          shiftTotals[shift] = (shiftTotals[shift] || 0) + (tip.amount || 0);
        });

        let topShift: string | null = null;
        let topShiftAmount = 0;
        Object.entries(shiftTotals).forEach(([shift, amount]) => {
          if (amount > topShiftAmount) {
            topShift = shift;
            topShiftAmount = amount;
          }
        });

        // Calculate week over week change
        const weekOverWeekChange = prevWeekTotal > 0
          ? ((totalTips - prevWeekTotal) / prevWeekTotal) * 100
          : 0;

        const stats: WeeklyStats = {
          userId: user.id,
          email: user.email,
          displayName: user.display_name || '',
          totalTips,
          totalHours,
          tipCount: tips.length,
          avgPerHour,
          bestDay,
          currentStreak: streakData?.current_streak || 0,
          weekOverWeekChange,
          topShift,
        };

        // Generate and send email
        const emailHtml = generateEmailHtml(stats, weekRange);
        const emailText = generateEmailText(stats, weekRange);

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'TipFly <noreply@codeflyai.com>',
            to: [user.email],
            subject: `Your Week in Tips: ${formatCurrency(totalTips)} earned`,
            html: emailHtml,
            text: emailText,
          }),
        });

        const resendData = await resendResponse.json();

        if (!resendResponse.ok) {
          throw new Error(resendData.message || 'Failed to send email');
        }

        console.log(`[weekly-summary] Sent to ${user.email}, ID: ${resendData.id}`);
        results.push({ userId: user.id, success: true });

      } catch (userError: any) {
        console.error(`[weekly-summary] Error for user ${user.id}:`, userError);
        results.push({ userId: user.id, success: false, error: userError.message });
      }
    }

    const successCount = results.filter(r => r.success && !r.error).length;
    const skipCount = results.filter(r => r.success && r.error).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        weekRange,
        processed: results.length,
        sent: successCount,
        skipped: skipCount,
        failed: failCount,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('[weekly-summary] Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send weekly summaries',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
