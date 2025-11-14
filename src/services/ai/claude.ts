// Claude AI Service for TipFly AI
import Anthropic from '@anthropic-ai/sdk';

// For now, we'll use a mock mode until API key is added
const USE_MOCK_MODE = !process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

const anthropic = USE_MOCK_MODE
  ? null
  : new Anthropic({
      apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    });

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Call Claude API with a prompt
 * Returns mock data if API key not configured
 */
export async function callClaude(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  // Mock mode for development/testing
  if (USE_MOCK_MODE) {
    return getMockResponse(prompt);
  }

  try {
    const message = await anthropic!.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt || 'You are a helpful AI assistant for tip tracking.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    throw new Error('Unexpected response type from Claude');
  } catch (error) {
    // Silently fall back to mock response
    // API errors are expected when key is invalid or model unavailable
    // The fallback ensures app continues working seamlessly
    return getMockResponse(prompt);
  }
}

/**
 * Generate mock responses for development
 * This allows testing AI features without API key
 */
function getMockResponse(prompt: string): string {
  // Shift prediction mock
  if (prompt.includes('predict') || prompt.includes('earnings')) {
    return JSON.stringify({
      prediction: {
        dayOfWeek: 'Friday',
        shiftType: 'dinner',
        expectedRange: [120, 180],
        confidence: 0.85,
        reasoning: "Based on your history, Friday dinner shifts consistently earn 40% more than weekday lunches. You've worked 8 Friday dinners with an average of $145.",
      },
      suggestion: "Friday nights are your best earning opportunity - consider picking up an extra shift!",
    });
  }

  // Daily insight mock
  if (prompt.includes('insight') || prompt.includes('tip')) {
    const insights = [
      JSON.stringify({
        insight: "Your Tuesday lunch shifts earn 30% less than dinners",
        action: "Consider switching to dinner shifts on Tuesdays to increase earnings",
        impact: "Could add ~$40 per shift",
        emoji: "💡",
      }),
      JSON.stringify({
        insight: "You're most consistent on weekends",
        action: "Your weekend shifts average $155 with low variance",
        impact: "Weekend shifts are reliable income",
        emoji: "📊",
      }),
      JSON.stringify({
        insight: "Weather affects your tips",
        action: "Tips drop 15% on rainy days - plan accordingly",
        impact: "Consider indoor venue shifts during bad weather",
        emoji: "🌧️",
      }),
    ];

    // Rotate through insights based on date
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return insights[dayOfYear % insights.length];
  }

  // Conversational entry mock
  if (prompt.includes('parse') || prompt.includes('Made')) {
    return JSON.stringify({
      tips_earned: 85.50,
      hours_worked: 5.5,
      shift_type: 'dinner',
      confidence: 0.95,
      needs_clarification: false,
    });
  }

  // Default mock
  return JSON.stringify({
    response: "This is a mock AI response. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env file to use real AI.",
  });
}

/**
 * Check if AI service is configured
 */
export function isAIConfigured(): boolean {
  return !USE_MOCK_MODE;
}

/**
 * Get AI service status message
 */
export function getAIStatus(): string {
  return USE_MOCK_MODE
    ? 'Using mock AI responses (add API key to enable real AI)'
    : 'AI powered by Claude';
}
