import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY?.trim();
const API_KEY_2 = process.env.GEMINI_API_KEY_2?.trim();

if (!API_KEY && !API_KEY_2) {
  throw new Error('At least one GEMINI_API_KEY is required');
}

const genAI = new GoogleGenerativeAI(API_KEY || API_KEY_2!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

const genAI2 = API_KEY_2 ? new GoogleGenerativeAI(API_KEY_2) : null;
const model2 = genAI2 ? genAI2.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }) : null;

interface APIError extends Error {
  status?: number;
  statusText?: string;
}

function isRateLimitError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return message.includes('503') || 
         message.includes('service unavailable') ||
         message.includes('rate limit') ||
         message.includes('too many requests') ||
         message.includes('quota exceeded');
}

function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return isRateLimitError(error) ||
         message.includes('timeout') ||
         message.includes('network') ||
         message.includes('connection') ||
         message.includes('temporary');
}

function getRetryDelay(attempt: number, isRateLimit: boolean): number {
  // Use longer delays for rate limiting
  const baseDelay = isRateLimit ? 5000 : 2000;
  const exponentialDelay = Math.pow(2, attempt) * baseDelay;
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 1000;
  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
}

export async function generateContentWithRetry(prompt: string, maxRetries = 3): Promise<string> {
  let lastError: APIError | null = null;
  
  // Try primary API key
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} with primary API key...`);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log('✅ Primary API key succeeded');
      return text;
    } catch (error) {
      const apiError = error instanceof Error ? error : new Error(String(error)) as APIError;
      console.log(`❌ Primary API attempt ${attempt} failed:`, apiError.message);
      lastError = apiError;
      
      if (!isRetryableError(apiError)) {
        console.log('🚫 Non-retryable error, switching to backup immediately');
        break;
      }
      
      if (attempt < maxRetries) {
        const isRateLimit = isRateLimitError(apiError);
        const delay = getRetryDelay(attempt, isRateLimit);
        console.log(`⏳ ${isRateLimit ? 'Rate limit detected.' : ''} Waiting ${Math.round(delay/1000)}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Try backup API key if available
  if (model2) {
    console.log('🔄 Switching to backup API key...');
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Backup attempt ${attempt}/${maxRetries}...`);
        const result = await model2.generateContent(prompt);
        const text = result.response.text();
        console.log('✅ Backup API key succeeded');
        return text;
      } catch (error) {
        const apiError = error instanceof Error ? error : new Error(String(error)) as APIError;
        console.log(`❌ Backup API attempt ${attempt} failed:`, apiError.message);
        lastError = apiError;
        
        if (!isRetryableError(apiError)) {
          console.log('🚫 Non-retryable error, giving up');
          break;
        }
        
        if (attempt < maxRetries) {
          const isRateLimit = isRateLimitError(apiError);
          const delay = getRetryDelay(attempt, isRateLimit);
          console.log(`⏳ ${isRateLimit ? 'Rate limit detected.' : ''} Waiting ${Math.round(delay/1000)}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }
  
  // If all attempts failed, provide a helpful error message
  const finalError = lastError || new Error('All API attempts failed');
  
  if (isRateLimitError(finalError)) {
    throw new Error(`AI service is currently experiencing high demand (503 Service Unavailable). This is temporary - please try again in a few minutes. The system will use fallback scoring if needed.`);
  }
  
  throw finalError;
}

export { model, model2, genAI, genAI2 };