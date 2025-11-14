// AI-powered conversational tip entry parsing
import { callClaude } from './claude';
import { sanitizeAIInput, validateParsedAIOutput } from '../../utils/security';

export interface ParsedTipEntry {
  tips_earned: number;
  hours_worked: number;
  shift_type?: 'breakfast' | 'lunch' | 'dinner' | 'late_night';
  notes?: string;
  confidence: number; // 0-1 - how confident the AI is in the parse
  needs_clarification: boolean;
  clarification_question?: string;
}

/**
 * Parse natural language input into structured tip entry data
 * Examples:
 * - "Made $85 in 5 hours tonight"
 * - "Lunch shift was good, earned 45 bucks in 3.5 hours"
 * - "Slow dinner, only $32 for 4 hours"
 */
export async function parseConversationalEntry(
  userInput: string
): Promise<ParsedTipEntry> {
  // SECURITY: Sanitize user input before sending to AI
  const sanitized = sanitizeAIInput(userInput);

  if (sanitized.blocked) {
    console.warn('[Security] Input blocked:', sanitized.reason);
    return {
      tips_earned: 0,
      hours_worked: 0,
      confidence: 0,
      needs_clarification: true,
      clarification_question: sanitized.reason || 'Please try a simpler description of your shift',
    };
  }

  const prompt = buildParsePrompt(sanitized.safe);

  try {
    const response = await callClaude(prompt, PARSE_SYSTEM_PROMPT);
    const parsed = JSON.parse(response);

    // Validate parsed response format
    if (!isValidParsedEntry(parsed)) {
      console.error('[Parse Error] Invalid response format:', parsed);
      return getFallbackParse(sanitized.safe);
    }

    // SECURITY: Validate AI output bounds before using
    const validation = validateParsedAIOutput(parsed);
    if (!validation.valid) {
      console.error('[Security] AI output failed validation:', validation.errors);
      return {
        ...parsed,
        tips_earned: 0,
        hours_worked: 0,
        needs_clarification: true,
        clarification_question: validation.errors[0] || 'Please check your input',
      };
    }

    return parsed;
  } catch (error) {
    console.error('[Conversational Entry Parse Error]:', error);
    return getFallbackParse(sanitized.safe);
  }
}

/**
 * Build prompt for parsing conversational entry
 */
function buildParsePrompt(userInput: string): string {
  return `Parse this tip entry from a service worker:

"${userInput}"

Extract the following information and return as JSON:
{
  "tips_earned": number (required - in dollars),
  "hours_worked": number (required - in decimal hours),
  "shift_type": "breakfast" | "lunch" | "dinner" | "late_night" (optional - infer from context),
  "notes": string (optional - any additional context),
  "confidence": 0.0-1.0 (required - how confident are you in this parse),
  "needs_clarification": boolean (required - true if critical info is missing),
  "clarification_question": string (optional - if needs_clarification is true)
}

Guidelines:
- Extract dollar amounts (handle $, "dollars", "bucks", etc.)
- Parse time durations (handle "hours", "hrs", "h", decimals like "3.5 hours")
- Infer shift_type from time indicators (morning/breakfast, lunch, dinner/evening/night, late night)
- If tips or hours are missing, set needs_clarification to true
- confidence should be 0.9+ if all info is clear, 0.7-0.9 if inferred, <0.7 if guessing
- Be generous with parsing - try to extract something useful even from vague input
- notes should capture mood, location, or other context from the message

Examples:
Input: "Made $85 in 5 hours tonight"
Output: {"tips_earned": 85, "hours_worked": 5, "shift_type": "dinner", "notes": null, "confidence": 0.95, "needs_clarification": false}

Input: "Lunch shift was good, earned 45 bucks in 3.5 hours"
Output: {"tips_earned": 45, "hours_worked": 3.5, "shift_type": "lunch", "notes": "good", "confidence": 0.95, "needs_clarification": false}

Input: "Slow dinner"
Output: {"tips_earned": 0, "hours_worked": 0, "shift_type": "dinner", "notes": "Slow dinner", "confidence": 0.3, "needs_clarification": true, "clarification_question": "How much did you make and how long did you work?"}`;
}

/**
 * Validate parsed entry has required fields
 */
function isValidParsedEntry(parsed: any): parsed is ParsedTipEntry {
  return (
    typeof parsed === 'object' &&
    typeof parsed.tips_earned === 'number' &&
    typeof parsed.hours_worked === 'number' &&
    typeof parsed.confidence === 'number' &&
    typeof parsed.needs_clarification === 'boolean'
  );
}

/**
 * Fallback when AI parsing fails
 */
function getFallbackParse(userInput: string): ParsedTipEntry {
  // Try basic regex extraction as fallback
  const dollarMatch = userInput.match(/\$?(\d+(?:\.\d{2})?)/);
  const hoursMatch = userInput.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b)/i);

  const hasTips = dollarMatch !== null;
  const hasHours = hoursMatch !== null;

  return {
    tips_earned: hasTips ? parseFloat(dollarMatch[1]) : 0,
    hours_worked: hasHours ? parseFloat(hoursMatch[1]) : 0,
    notes: userInput,
    confidence: (hasTips && hasHours) ? 0.6 : 0.3,
    needs_clarification: !hasTips || !hasHours,
    clarification_question: !hasTips
      ? 'How much did you make in tips?'
      : 'How many hours did you work?',
  };
}

/**
 * System prompt for conversational parsing
 */
const PARSE_SYSTEM_PROMPT = `You are an AI assistant that helps service workers (servers, bartenders, delivery drivers, etc.) log their tip earnings.

Your job is to parse natural language input into structured data.

Be:
- Flexible and generous with parsing (people type casually)
- Smart about inferring shift types from context
- Honest about confidence levels
- Helpful when clarification is needed

Always return valid JSON in the exact format requested.`;
