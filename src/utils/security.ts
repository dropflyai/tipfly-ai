// Security utilities for TipFly AI

// Input validation
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain an uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain a lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain a number' };
  }
  return { valid: true };
};

export const validateTipAmount = (amount: number): boolean => {
  return amount >= 0 && amount <= 100000; // Max $100K per shift
};

export const validateHours = (hours: number): boolean => {
  return hours > 0 && hours <= 24; // Max 24 hours
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS chars
    .substring(0, 500); // Limit length
};

export const sanitizeNumericInput = (input: string): string => {
  return input.replace(/[^0-9.]/g, ''); // Only numbers and decimal
};

// Data masking for logs (don't log sensitive data)
export const maskEmail = (email: string): string => {
  const [name, domain] = email.split('@');
  return `${name.substring(0, 2)}***@${domain}`;
};

export const maskAmount = (amount: number): string => {
  return `$***${amount.toString().slice(-2)}`; // Show only last 2 digits
};

// Rate limiting helper (client-side)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export const checkRateLimit = (key: string, limit: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  let entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    requestCounts.set(key, entry);
  }

  if (entry.count >= limit) {
    return false; // Rate limit exceeded
  }

  entry.count++;
  return true;
};

// Secure random string generation
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
};

// Check if running in secure context
export const isSecureContext = (): boolean => {
  return window.isSecureContext ?? false;
};

// Prevent sensitive data from being logged
export const sanitizeErrorForLogging = (error: any): any => {
  if (typeof error === 'object' && error !== null) {
    const sanitized: any = { ...error };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'creditCard'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  return error;
};

// ============================================================================
// AI-SPECIFIC SECURITY GUARDRAILS
// ============================================================================

/**
 * Sanitize user input before sending to AI
 * Prevents prompt injection and malicious content
 */
export const sanitizeAIInput = (input: string): { safe: string; blocked: boolean; reason?: string } => {
  // Length check
  if (input.length === 0) {
    return { safe: '', blocked: true, reason: 'Input cannot be empty' };
  }
  if (input.length > 1000) {
    return { safe: '', blocked: true, reason: 'Input too long (max 1000 characters)' };
  }

  // Detect prompt injection attempts
  const injectionPatterns = [
    /ignore\s+(previous|above|prior)\s+instructions?/i,
    /disregard\s+.{0,20}instructions?/i,
    /forget\s+.{0,20}(instructions?|context|system)/i,
    /new\s+instructions?:/i,
    /system\s*:/i,
    /assistant\s*:/i,
    /\[INST\]/i,
    /\[\/INST\]/i,
    /<\|.*?\|>/i, // Token markers
    /```.*?system/is, // Code blocks with system
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(input)) {
      return {
        safe: '',
        blocked: true,
        reason: 'Input contains potentially unsafe patterns',
      };
    }
  }

  // Remove dangerous characters but allow normal punctuation
  let cleaned = input
    .replace(/[<>{}]/g, '') // Remove brackets that could be used for injection
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim();

  // Limit repeated characters (anti-spam)
  cleaned = cleaned.replace(/(.)\1{10,}/g, '$1$1$1'); // Max 3 repeats

  return { safe: cleaned, blocked: false };
};

/**
 * Validate AI-parsed output before using it
 * Extra bounds checking beyond normal validation
 */
export const validateParsedAIOutput = (data: {
  tips_earned?: number;
  hours_worked?: number;
  confidence?: number;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Tips validation with stricter bounds
  if (data.tips_earned !== undefined) {
    if (typeof data.tips_earned !== 'number' || isNaN(data.tips_earned)) {
      errors.push('Tips earned must be a valid number');
    } else if (data.tips_earned < 0) {
      errors.push('Tips earned cannot be negative');
    } else if (data.tips_earned > 100000) {
      errors.push('Tips earned exceeds maximum ($100,000)');
    }
  }

  // Hours validation with stricter bounds
  if (data.hours_worked !== undefined) {
    if (typeof data.hours_worked !== 'number' || isNaN(data.hours_worked)) {
      errors.push('Hours worked must be a valid number');
    } else if (data.hours_worked <= 0) {
      errors.push('Hours worked must be greater than 0');
    } else if (data.hours_worked > 24) {
      errors.push('Hours worked exceeds 24 hours');
    }
  }

  // Confidence validation
  if (data.confidence !== undefined) {
    if (typeof data.confidence !== 'number' || isNaN(data.confidence)) {
      errors.push('Confidence must be a valid number');
    } else if (data.confidence < 0 || data.confidence > 1) {
      errors.push('Confidence must be between 0 and 1');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Rate limiting for AI API calls (per-user, client-side)
 * Prevents abuse and controls costs
 */
const aiRequestCounts = new Map<string, { count: number; resetAt: number }>();

export const checkAIRateLimit = (
  userId: string,
  limit: number = 20, // 20 requests per hour
  windowMs: number = 3600000 // 1 hour
): { allowed: boolean; remaining: number; resetIn: number } => {
  const now = Date.now();
  const key = `ai_${userId}`;
  let entry = aiRequestCounts.get(key);

  // Reset window if expired
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    aiRequestCounts.set(key, entry);
  }

  // Check limit
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    };
  }

  // Increment and allow
  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetIn: entry.resetAt - now,
  };
};

/**
 * Detect suspiciously similar inputs (potential spam/abuse)
 */
const recentInputs = new Map<string, { hash: string; timestamp: number }[]>();

export const detectSpamInput = (userId: string, input: string): boolean => {
  const key = `spam_${userId}`;
  const now = Date.now();
  const windowMs = 60000; // 1 minute

  // Simple hash for similarity detection
  const hash = input.toLowerCase().replace(/\s+/g, '').substring(0, 50);

  // Get recent inputs
  let recent = recentInputs.get(key) || [];

  // Clean old entries
  recent = recent.filter((r) => now - r.timestamp < windowMs);

  // Check for duplicates
  const duplicates = recent.filter((r) => r.hash === hash).length;

  // Update recent
  recent.push({ hash, timestamp: now });
  recentInputs.set(key, recent.slice(-10)); // Keep last 10

  // Flag as spam if 3+ identical inputs in 1 minute
  return duplicates >= 3;
};
