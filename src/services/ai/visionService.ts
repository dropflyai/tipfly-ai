// Claude Vision Service for analyzing screenshots and receipts
import Anthropic from '@anthropic-ai/sdk';
import * as FileSystem from 'expo-file-system';

const USE_MOCK_MODE = !process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

const anthropic = USE_MOCK_MODE
  ? null
  : new Anthropic({
      apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    });

// Supported delivery/rideshare apps
export type DeliveryApp =
  | 'doordash'
  | 'uber_eats'
  | 'grubhub'
  | 'instacart'
  | 'shipt'
  | 'uber'
  | 'lyft'
  | 'spark'
  | 'amazon_flex'
  | 'unknown';

// Extracted earnings data from screenshot
export interface ExtractedEarnings {
  app: DeliveryApp;
  appConfidence: number;
  totalEarnings: number;
  tipAmount: number | null;
  basePay: number | null;
  bonuses: number | null;
  dateRange: {
    start: string | null; // YYYY-MM-DD
    end: string | null;
  } | null;
  singleDate: string | null; // For single day summaries
  deliveryCount: number | null;
  hoursWorked: number | null;
  rawText: string; // Original text for debugging
  confidence: number; // Overall confidence 0-1
  needsReview: boolean;
  reviewReason?: string;
}

// Extracted receipt data
export interface ExtractedReceipt {
  merchantName: string | null;
  date: string | null; // YYYY-MM-DD
  totalAmount: number | null;
  tipAmount: number | null;
  subtotal: number | null;
  tax: number | null;
  paymentMethod: string | null;
  rawText: string;
  confidence: number;
  needsReview: boolean;
  reviewReason?: string;
}

/**
 * Convert image URI to base64 for Claude Vision API
 */
async function imageToBase64(imageUri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('[VisionService] Error converting image to base64:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Determine media type from URI
 */
function getMediaType(uri: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.gif')) return 'image/gif';
  if (lower.includes('.webp')) return 'image/webp';
  return 'image/jpeg'; // Default to JPEG
}

/**
 * Analyze a delivery/rideshare app screenshot to extract earnings
 */
export async function analyzeEarningsScreenshot(imageUri: string): Promise<ExtractedEarnings> {
  console.log('[VisionService] Analyzing earnings screenshot');

  if (USE_MOCK_MODE) {
    return getMockEarningsResult();
  }

  try {
    const base64Image = await imageToBase64(imageUri);
    const mediaType = getMediaType(imageUri);

    const systemPrompt = `You are an expert at analyzing screenshots from delivery and rideshare apps.

SUPPORTED APPS & THEIR PATTERNS:
- DoorDash: Red UI. Look for "Base Pay", "Tips", "Peak Pay", "Promotions". Weekly shows "Dash" count.
- Uber Eats: Black/green UI. Look for "Trip Earnings", "Tips", "Surge". Shows "Trips" or "Deliveries".
- Grubhub: Orange/red UI. Look for "Delivery Pay", "Tips", "Bonus", "Contribution".
- Instacart: Green UI. Look for "Batch Payment", "Tip", "Heavy Order Bump", "Quality Bonus".
- Shipt: Green UI. Look for "Order Pay", "Promo Pay", "Tips". Shows "Orders".
- Uber (rideshare): Black UI. Look for "Trip Fare", "Tips", "Surge", "Quest bonus".
- Lyft: Pink/magenta UI. Look for "Ride Earnings", "Tips", "Bonuses", "Streaks".
- Spark (Walmart): Blue UI. Look for "Trip Earnings", "Tips", "Incentives".
- Amazon Flex: Orange UI. Look for "Earnings", "Tips". Shows "Blocks".

SCREEN TYPES TO RECOGNIZE:
- Daily summary: Shows single day earnings (use singleDate)
- Weekly summary: Shows date range like "Dec 23 - Dec 29" (use dateRange)
- Single delivery/trip: One order detail (use singleDate, deliveryCount=1)
- Earnings list: Multiple line items (sum visible amounts, note if partial)

EXTRACTION RULES:
1. totalEarnings = The main/total amount shown (largest prominent number)
2. tipAmount = Any line labeled "Tips", "Tip", or "Customer tip"
3. basePay = Base/delivery/trip pay BEFORE tips and bonuses
4. bonuses = Peak pay, surge, promotions, incentives, quest bonuses combined
5. For dates: Convert "Today" to current date, "This Week" to appropriate range
6. Parse currency: Remove "$" and commas, handle decimals (e.g., "$1,234.56" → 1234.56)

IMPORTANT: Return ONLY valid JSON matching this structure:
{
  "app": "doordash|uber_eats|grubhub|instacart|shipt|uber|lyft|spark|amazon_flex|unknown",
  "appConfidence": 0.0-1.0,
  "totalEarnings": number,
  "tipAmount": number or null,
  "basePay": number or null,
  "bonuses": number or null,
  "dateRange": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" } or null,
  "singleDate": "YYYY-MM-DD" or null,
  "deliveryCount": number or null,
  "hoursWorked": number or null,
  "rawText": "key earnings text extracted",
  "confidence": 0.0-1.0,
  "needsReview": boolean,
  "reviewReason": "reason if needsReview is true"
}

Set needsReview=true if:
- Screenshot is cropped/partial
- Numbers are blurry or partially visible
- Multiple time periods shown (unclear which to use)
- Can't determine if tips are included in total`;

    const response = await anthropic!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: 'Analyze this delivery/rideshare app screenshot and extract the earnings information. Return only JSON.',
            },
          ],
        },
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as ExtractedEarnings;
    console.log('[VisionService] Extracted earnings:', parsed);
    return parsed;

  } catch (error) {
    console.error('[VisionService] Error analyzing screenshot:', error);
    return getMockEarningsResult();
  }
}

/**
 * Analyze a receipt image to extract tip and total information
 */
export async function analyzeReceipt(imageUri: string): Promise<ExtractedReceipt> {
  console.log('[VisionService] Analyzing receipt');

  if (USE_MOCK_MODE) {
    return getMockReceiptResult();
  }

  try {
    const base64Image = await imageToBase64(imageUri);
    const mediaType = getMediaType(imageUri);

    const systemPrompt = `You are an expert at reading and extracting information from receipts.

Your task is to extract key information from the receipt image and return it as JSON.

IMPORTANT: Return ONLY valid JSON, no other text. The JSON must match this exact structure:
{
  "merchantName": "string or null",
  "date": "YYYY-MM-DD or null",
  "totalAmount": number or null,
  "tipAmount": number or null,
  "subtotal": number or null,
  "tax": number or null,
  "paymentMethod": "string or null",
  "rawText": "key text from receipt",
  "confidence": 0.0-1.0,
  "needsReview": boolean,
  "reviewReason": "reason if needsReview is true"
}

Guidelines:
- Look for the merchant/restaurant name at the top
- Find the date in various formats (12/25/24, Dec 25, 2024, etc.) and convert to YYYY-MM-DD
- Extract the tip line if present (may say "Tip", "Gratuity", "Service Charge")
- Get the total (final amount charged)
- If signed receipt with tip filled in, use that tip amount
- Set needsReview=true if handwriting is hard to read or values are unclear`;

    const response = await anthropic!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: 'Analyze this receipt image and extract the tip and payment information. Return only JSON.',
            },
          ],
        },
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as ExtractedReceipt;
    console.log('[VisionService] Extracted receipt:', parsed);
    return parsed;

  } catch (error) {
    console.error('[VisionService] Error analyzing receipt:', error);
    return getMockReceiptResult();
  }
}

/**
 * Mock earnings result for development/testing
 */
function getMockEarningsResult(): ExtractedEarnings {
  return {
    app: 'doordash',
    appConfidence: 0.95,
    totalEarnings: 156.42,
    tipAmount: 89.50,
    basePay: 52.75,
    bonuses: 14.17,
    dateRange: {
      start: '2024-12-23',
      end: '2024-12-29',
    },
    singleDate: null,
    deliveryCount: 23,
    hoursWorked: 12.5,
    rawText: 'Weekly Summary: $156.42 total, 23 deliveries, Tips: $89.50',
    confidence: 0.9,
    needsReview: false,
  };
}

/**
 * Mock receipt result for development/testing
 */
function getMockReceiptResult(): ExtractedReceipt {
  return {
    merchantName: 'The Local Bistro',
    date: '2024-12-28',
    totalAmount: 67.84,
    tipAmount: 12.00,
    subtotal: 52.50,
    tax: 3.34,
    paymentMethod: 'Visa **4242',
    rawText: 'The Local Bistro, Total: $67.84, Tip: $12.00',
    confidence: 0.85,
    needsReview: false,
  };
}
