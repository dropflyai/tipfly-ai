// AI-powered shift predictions and insights
import { callClaude } from './claude';
import { TipEntry } from '../../types';
import { formatCurrency } from '../../utils/formatting';

export interface ShiftPrediction {
  dayOfWeek: string;
  shiftType: 'breakfast' | 'lunch' | 'dinner' | 'late_night';
  expectedRange: [number, number]; // [min, max] earnings
  confidence: number; // 0-1
  reasoning: string;
  suggestion: string;
}

/**
 * Generate AI-powered shift prediction based on historical data
 */
export async function generateShiftPrediction(
  tipEntries: TipEntry[],
  targetDay?: string
): Promise<ShiftPrediction> {
  // Analyze tip patterns
  const analysis = analyzeTipPatterns(tipEntries);

  // Build prompt for Claude
  const prompt = buildPredictionPrompt(analysis, targetDay);

  // Call Claude API
  const response = await callClaude(prompt, PREDICTION_SYSTEM_PROMPT);

  // Parse response
  try {
    const parsed = JSON.parse(response);
    return parsed.prediction;
  } catch (error) {
    console.error('[Prediction Parse Error]:', error);
    // Return fallback prediction
    return getFallbackPrediction(analysis);
  }
}

/**
 * Analyze tip entry patterns
 */
function analyzeTipPatterns(entries: TipEntry[]) {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      averageTips: 0,
      bestDay: null,
      bestShift: null,
    };
  }

  // Group by day of week
  const byDay: Record<string, number[]> = {};
  const byShift: Record<string, number[]> = {};

  entries.forEach((entry) => {
    const date = new Date(entry.date);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

    if (!byDay[dayOfWeek]) byDay[dayOfWeek] = [];
    if (!byShift[entry.shift_type]) byShift[entry.shift_type] = [];

    byDay[dayOfWeek].push(entry.tips_earned);
    byShift[entry.shift_type].push(entry.tips_earned);
  });

  // Calculate averages
  const dayAverages = Object.entries(byDay).map(([day, tips]) => ({
    day,
    average: tips.reduce((sum, t) => sum + t, 0) / tips.length,
    count: tips.length,
  }));

  const shiftAverages = Object.entries(byShift).map(([shift, tips]) => ({
    shift,
    average: tips.reduce((sum, t) => sum + t, 0) / tips.length,
    count: tips.length,
  }));

  // Find best performing day and shift
  const bestDay = dayAverages.sort((a, b) => b.average - a.average)[0];
  const bestShift = shiftAverages.sort((a, b) => b.average - a.average)[0];

  return {
    totalEntries: entries.length,
    averageTips: entries.reduce((sum, e) => sum + e.tips_earned, 0) / entries.length,
    dayAverages,
    shiftAverages,
    bestDay,
    bestShift,
  };
}

/**
 * Build prediction prompt for Claude
 */
function buildPredictionPrompt(analysis: any, targetDay?: string): string {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const predictionDay = targetDay || getNextBestDay(today);

  return `You are an AI assistant helping service workers optimize their earnings.

Analyze this tip data and generate a prediction:

Total Shifts: ${analysis.totalEntries}
Average Tips: ${formatCurrency(analysis.averageTips)}
Best Performing Day: ${analysis.bestDay?.day} (${formatCurrency(analysis.bestDay?.average || 0)} average, ${analysis.bestDay?.count} shifts)
Best Shift Type: ${analysis.bestShift?.shift} (${formatCurrency(analysis.bestShift?.average || 0)} average)

Day Breakdown:
${analysis.dayAverages?.map((d: any) => `- ${d.day}: ${formatCurrency(d.average)} avg (${d.count} shifts)`).join('\n')}

Shift Breakdown:
${analysis.shiftAverages?.map((s: any) => `- ${s.shift}: ${formatCurrency(s.average)} avg (${s.count} shifts)`).join('\n')}

Generate a prediction for ${predictionDay} with this exact JSON format:
{
  "prediction": {
    "dayOfWeek": "${predictionDay}",
    "shiftType": "dinner",
    "expectedRange": [min_amount, max_amount],
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation based on the data pattern",
    "suggestion": "Actionable advice for the user"
  }
}

Rules:
- Base expectedRange on historical performance for that day
- confidence should be based on sample size (more data = higher confidence)
- reasoning should reference specific data points
- suggestion should be practical and encouraging
- Keep all text concise and friendly`;
}

/**
 * Get next best day to work based on current day
 */
function getNextBestDay(currentDay: string): string {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentIndex = daysOfWeek.indexOf(currentDay);

  // Fridays and Saturdays are typically best for service industry
  if (currentIndex < 4) return 'Friday';
  if (currentIndex === 4) return 'Saturday';
  if (currentIndex === 5) return 'Sunday';
  return 'Friday';
}

/**
 * Fallback prediction when AI fails
 */
function getFallbackPrediction(analysis: any): ShiftPrediction {
  return {
    dayOfWeek: analysis.bestDay?.day || 'Friday',
    shiftType: 'dinner',
    expectedRange: [
      Math.round((analysis.averageTips || 80) * 0.8),
      Math.round((analysis.averageTips || 80) * 1.2),
    ],
    confidence: 0.7,
    reasoning: `Based on your ${analysis.totalEntries} shifts, ${analysis.bestDay?.day || 'weekends'} tend to be your most profitable.`,
    suggestion: `Consider picking up more ${analysis.bestDay?.day || 'Friday'} shifts to maximize your earnings!`,
  };
}

/**
 * System prompt for predictions
 */
const PREDICTION_SYSTEM_PROMPT = `You are an AI earnings advisor for service workers (servers, bartenders, delivery drivers, etc.).

Your goal is to help them maximize their income by:
1. Analyzing their tip patterns
2. Predicting future earnings based on historical data
3. Suggesting optimal work schedules

Be:
- Data-driven and specific
- Encouraging and supportive
- Practical and actionable
- Brief and easy to understand

Always return valid JSON in the exact format requested.`;
