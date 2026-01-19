// AI-powered daily insights
import { callClaude } from './claude';
import { TipEntry } from '../../types';
import { formatCurrency } from '../../utils/formatting';

export interface DailyInsight {
  insight: string;
  action: string;
  impact: string;
  emoji: string;
  category: 'earnings' | 'schedule' | 'efficiency' | 'trends';
}

/**
 * Generate personalized daily insight based on tip history
 */
export async function generateDailyInsight(
  tipEntries: TipEntry[]
): Promise<DailyInsight> {
  // Analyze patterns
  const analysis = analyzePatterns(tipEntries);

  // Build prompt for Claude
  const prompt = buildInsightPrompt(analysis);

  // Call Claude API
  try {
    const response = await callClaude(prompt, INSIGHTS_SYSTEM_PROMPT);
    const parsed = JSON.parse(response);
    return parsed.insight;
  } catch (error) {
    console.error('[Insight Generation Error]:', error);
    // Return fallback insight
    return getFallbackInsight(analysis);
  }
}

/**
 * Analyze tip patterns for insights
 */
function analyzePatterns(entries: TipEntry[]) {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      totalEarnings: 0,
      averagePerShift: 0,
      averageHourlyRate: 0,
      bestDay: null,
      worstDay: null,
      consistencyScore: 0,
    };
  }

  // Calculate totals
  const totalEarnings = entries.reduce((sum, e) => sum + e.tips_earned, 0);
  const totalHours = entries.reduce((sum, e) => sum + e.hours_worked, 0);
  const averagePerShift = totalEarnings / entries.length;
  const averageHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

  // Group by day of week
  const byDay: Record<string, { tips: number[]; hours: number[] }> = {};
  entries.forEach((entry) => {
    const date = new Date(entry.date);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

    if (!byDay[dayOfWeek]) {
      byDay[dayOfWeek] = { tips: [], hours: [] };
    }

    byDay[dayOfWeek].tips.push(entry.tips_earned);
    byDay[dayOfWeek].hours.push(entry.hours_worked);
  });

  // Calculate day averages
  const dayAverages = Object.entries(byDay).map(([day, data]) => ({
    day,
    avgTips: data.tips.reduce((sum, t) => sum + t, 0) / data.tips.length,
    avgHours: data.hours.reduce((sum, h) => sum + h, 0) / data.hours.length,
    count: data.tips.length,
  }));

  // Find best and worst days
  const sortedDays = [...dayAverages].sort((a, b) => b.avgTips - a.avgTips);
  const bestDay = sortedDays[0];
  const worstDay = sortedDays[sortedDays.length - 1];

  // Calculate consistency (standard deviation of earnings)
  const variance =
    entries.reduce((sum, e) => sum + Math.pow(e.tips_earned - averagePerShift, 2), 0) /
    entries.length;
  const stdDev = Math.sqrt(variance);
  const consistencyScore = averagePerShift > 0 ? 1 - stdDev / averagePerShift : 0;

  // Recent trends (last 7 days vs previous 7 days)
  const last7Days = entries.slice(0, Math.min(7, entries.length));
  const previous7Days = entries.slice(7, Math.min(14, entries.length));

  const last7Avg =
    last7Days.length > 0
      ? last7Days.reduce((sum, e) => sum + e.tips_earned, 0) / last7Days.length
      : 0;
  const prev7Avg =
    previous7Days.length > 0
      ? previous7Days.reduce((sum, e) => sum + e.tips_earned, 0) / previous7Days.length
      : 0;

  const trendDirection = prev7Avg > 0 ? ((last7Avg - prev7Avg) / prev7Avg) * 100 : 0;

  return {
    totalEntries: entries.length,
    totalEarnings,
    averagePerShift,
    averageHourlyRate,
    bestDay,
    worstDay,
    consistencyScore,
    trendDirection,
    dayAverages,
  };
}

/**
 * Build insight prompt for Claude
 */
function buildInsightPrompt(analysis: any): string {
  return `You are an AI earnings advisor for service workers.

Analyze this data and generate ONE actionable daily insight:

Total Shifts: ${analysis.totalEntries}
Total Earnings: ${formatCurrency(analysis.totalEarnings)}
Average per Shift: ${formatCurrency(analysis.averagePerShift)}
Average Hourly Rate: ${formatCurrency(analysis.averageHourlyRate)}/hr
Best Day: ${analysis.bestDay?.day} (${formatCurrency(analysis.bestDay?.avgTips || 0)} avg)
Worst Day: ${analysis.worstDay?.day} (${formatCurrency(analysis.worstDay?.avgTips || 0)} avg)
Consistency Score: ${((analysis.consistencyScore || 0) * 100).toFixed(0)}%
Recent Trend: ${(analysis.trendDirection || 0) > 0 ? '+' : ''}${(analysis.trendDirection || 0).toFixed(1)}%

Generate a single insight in this exact JSON format:
{
  "insight": {
    "insight": "Brief observation about their earnings pattern",
    "action": "Specific actionable advice",
    "impact": "Potential financial impact",
    "emoji": "Relevant emoji (💡, 📊, 🌟, 💰, 📈, 📉, ⚡, 🎯, etc.)",
    "category": "earnings" | "schedule" | "efficiency" | "trends"
  }
}

Rules:
- Keep insight concise (1-2 sentences max)
- Action should be specific and actionable
- Impact should mention money/time if possible
- Choose the MOST IMPORTANT pattern to highlight
- Be encouraging and supportive
- Focus on opportunities, not just problems
- Use data-driven observations`;
}

/**
 * Fallback insight when AI fails
 */
function getFallbackInsight(analysis: any): DailyInsight {
  // Choose best fallback based on available data
  if (analysis.totalEntries === 0) {
    return {
      insight: "Start logging your shifts to unlock personalized insights!",
      action: "Add your first tip entry to begin tracking patterns",
      impact: "Data-driven decisions can boost earnings by 15-20%",
      emoji: "🚀",
      category: "earnings",
    };
  }

  if (analysis.bestDay && analysis.worstDay) {
    const diff = analysis.bestDay.avgTips - analysis.worstDay.avgTips;
    return {
      insight: `${analysis.bestDay.day} earns ${formatCurrency(diff)} more than ${analysis.worstDay.day} on average`,
      action: `Consider picking up more ${analysis.bestDay.day} shifts`,
      impact: `Could add ${formatCurrency(diff)} per shift`,
      emoji: "📊",
      category: "schedule",
    };
  }

  if (analysis.trendDirection && analysis.trendDirection > 10) {
    return {
      insight: "Your earnings are trending up!",
      action: `Keep up the momentum - you're up ${analysis.trendDirection.toFixed(0)}%`,
      impact: "Positive trends compound over time",
      emoji: "📈",
      category: "trends",
    };
  }

  return {
    insight: `You're averaging ${formatCurrency(analysis.averageHourlyRate)}/hr`,
    action: "Focus on high-earning time slots to maximize income",
    impact: "Small schedule tweaks can boost hourly rate",
    emoji: "💡",
    category: "efficiency",
  };
}

/**
 * System prompt for insights
 */
const INSIGHTS_SYSTEM_PROMPT = `You are an AI earnings advisor for service workers (servers, bartenders, delivery drivers, etc.).

Your goal is to provide ONE daily insight that helps them earn more money.

Focus on:
1. Scheduling optimization (best days/shifts)
2. Consistency patterns
3. Recent trends
4. Hourly rate efficiency
5. Earnings opportunities

Be:
- Data-driven and specific
- Encouraging and positive
- Actionable (give clear next steps)
- Brief and easy to understand
- Financially focused (mention dollar amounts)

Always return valid JSON in the exact format requested.`;
