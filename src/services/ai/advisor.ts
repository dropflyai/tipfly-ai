// TipFly AI Advisor Service
// Provides app navigation help, earnings insights, and general financial education
// NOT a professional tax/legal/financial advisor - always recommends professionals

import { sanitizeAIInput } from '../../utils/security';
import { formatCurrency } from '../../utils/formatting';
import { supabase } from '../api/supabase';

const ADVISOR_TIMEOUT_MS = 30000;

export interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AdvisorContext {
  userName: string;
  isPremium: boolean;
  totalTipsThisWeek: number;
  avgHourlyRate: number;
  deductionProgress: number;
  totalTipsYTD: number;
  tipCount: number;
}

function buildSystemPrompt(context: AdvisorContext): string {
  const dataSection = context.tipCount > 0
    ? `
USER'S TRACKED DATA (from their TipFly account):
- Name: ${context.userName}
- Subscription: ${context.isPremium ? 'Premium' : 'Free'}
- Tips logged this week: ${formatCurrency(context.totalTipsThisWeek)}
- Average hourly rate: ${formatCurrency(context.avgHourlyRate)}/hr
- Year-to-date tips: ${formatCurrency(context.totalTipsYTD)}
- Total tips logged: ${context.tipCount}
- Deduction progress: ${context.deductionProgress.toFixed(0)}% toward $25,000

Use this data when the user asks about their earnings, progress, or patterns. Frame it as "Based on your tracked data..." not "You earned..." since you're showing what they logged, not verifying accuracy.`
    : `
USER INFO:
- Name: ${context.userName}
- Subscription: ${context.isPremium ? 'Premium' : 'Free'}
- No tips logged yet - encourage them to start tracking!`;

  return `You are the TipFly AI Advisor - a friendly, knowledgeable assistant for service industry workers who use the TipFly tip-tracking app.

YOUR ROLE: You are an educator and data analyst, NOT a professional tax advisor, accountant, or attorney.

${dataSection}

APP NAVIGATION GUIDE (use this to help users find features):
- ADD A TIP: Tap the gold "+" button (bottom-right corner) on any screen. You can type naturally like "Made $85 in 5 hours tonight" or fill in the form manually.
- VIEW ANALYTICS: Tap the "Analytics" tab at the bottom to see earnings trends, best days, hourly rates, and charts.
- TIP POOLING: On the Home dashboard, look for the "Tip Pooling" card. Tap it to create or join a team and split tips with coworkers.
- GOALS: Go to Profile tab > Goals to set weekly/monthly earning targets.
- EXPORT REPORTS: Go to Profile tab > Export Reports for CSV/PDF exports of your tip history.
- TAX TRACKING: Go to Profile tab > Tax Tracking to see your deduction progress toward the $25,000 No Tax on Tips threshold.
- MANAGE JOBS: Go to Profile tab > Jobs to add or edit your workplaces and positions.
- SETTINGS: Profile tab has account settings, notifications, privacy, and app lock.
- UPGRADE: Tap any locked feature or go to Profile tab > Upgrade to Premium.

GENERAL KNOWLEDGE (public information you can share freely):
- The "No Tax on Tips Act" was signed into law on July 4, 2025, as part of the One Big Beautiful Bill.
- Workers can deduct up to $25,000 in qualified tips from federal income tax for years 2025-2028.
- Both cash and credit card tips qualify if properly reported.
- The deduction applies to federal income tax only (state taxes vary).
- Workers still need to report all tips to their employer and on their tax return.
- TipFly helps track tips to create records that support the deduction claim.

SAFETY GUARDRAILS - YOU MUST FOLLOW THESE:
1. NEVER give specific tax filing instructions (e.g., "claim X on line Y of your 1040")
2. NEVER tell someone to take legal action against their employer
3. NEVER promise specific financial outcomes ("you'll save exactly $X")
4. NEVER advise on investments, stocks, or cryptocurrency
5. NEVER diagnose health conditions (burnout, etc.)
6. ALWAYS use hedge language: "You may want to consider..." not "You should..."
7. ALWAYS recommend consulting a professional for specific tax, legal, or financial decisions
8. Frame data insights as "Based on your tracked data..." not definitive statements

RESPONSE STYLE:
- Be warm, encouraging, and concise (2-4 short paragraphs max)
- Use simple language - many users may not be familiar with financial terminology
- When discussing the user's data, highlight positive trends and actionable patterns
- If asked something outside your scope, say so honestly and suggest who could help
- Don't use markdown formatting or bullet points - keep responses as natural conversation
- Don't use emojis unless the user does first`;
}

export async function askAdvisor(
  message: string,
  history: AdvisorMessage[],
  context: AdvisorContext,
): Promise<string> {
  const sanitized = sanitizeAIInput(message);

  if (sanitized.blocked) {
    return sanitized.reason || 'I couldn\'t process that message. Could you try rephrasing?';
  }

  try {
    // Build conversation history (last 10 messages for context)
    const recentHistory = history.slice(-10);
    const messages = [
      ...recentHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: sanitized.safe },
    ];

    const { data, error } = await supabase.functions.invoke('ai-advisor', {
      body: {
        system: buildSystemPrompt(context),
        messages,
      },
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }

    const content = data?.content?.[0];

    if (content?.type === 'text') {
      return content.text;
    }

    throw new Error('Unexpected response format');
  } catch (error: any) {
    console.warn('[Advisor] API call failed:', error);
    return getMockAdvisorResponse(sanitized.safe);
  }
}

function getMockAdvisorResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('add') && lower.includes('tip')) {
    return 'To add a tip, tap the gold "+" button in the bottom-right corner of any screen. You can type naturally like "Made $85 in 5 hours tonight" using the AI entry mode, or switch to manual entry to fill in the form yourself.';
  }

  if (lower.includes('tax') || lower.includes('deduction') || lower.includes('25,000') || lower.includes('25000')) {
    return 'The No Tax on Tips Act was signed into law on July 4, 2025. It allows workers to deduct up to $25,000 in qualified tips from federal income tax for 2025-2028. You can track your progress toward this deduction right here in TipFly. For specific questions about how this applies to your tax situation, you may want to consult a tax professional who can review your complete financial picture.';
  }

  if (lower.includes('export') || lower.includes('report') || lower.includes('pdf') || lower.includes('csv')) {
    return 'You can export your tip history by going to the Profile tab and tapping "Export Reports." From there you can generate CSV or PDF reports of your tip data. Premium members get unlimited exports plus tax-ready reports.';
  }

  if (lower.includes('team') || lower.includes('pool') || lower.includes('split')) {
    return 'You can set up tip pooling from the "Tip Pooling" card on your Home dashboard. Create a team, share the invite code with coworkers, and then split tips after each shift. Each team member confirms their share before it\'s finalized.';
  }

  if (lower.includes('goal') || lower.includes('target')) {
    return 'You can set earning goals from the Profile tab by tapping "Goals." Set weekly or monthly targets, and TipFly will track your progress and let you know when you hit them. This is a Premium feature that helps you stay motivated and on track.';
  }

  if (lower.includes('how am i doing') || lower.includes('this week') || lower.includes('earnings') || lower.includes('stats')) {
    return 'You can see your full earnings breakdown in the Analytics tab at the bottom of the screen. It shows your daily, weekly, and monthly trends, your best earning days, and your average hourly rate. The Home dashboard also shows a quick summary of today and this week.';
  }

  if (lower.includes('upgrade') || lower.includes('premium') || lower.includes('subscription')) {
    return 'Premium gives you unlimited AI insights, goal tracking, detailed tax reports, unlimited exports, and full tip history. You can upgrade from the Profile tab or by tapping any locked feature. There\'s a free trial available so you can try everything before committing.';
  }

  return 'Hey! I\'m your TipFly Advisor. I can help you navigate the app, understand your earning patterns, and learn about tip tax deductions. Try asking me things like "How do I add a tip?", "What\'s the No Tax on Tips Act?", or "How am I doing this week?"';
}
