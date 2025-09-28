import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY?.trim();
const API_KEY_2 = process.env.GEMINI_API_KEY_2?.trim();

if (!API_KEY && !API_KEY_2) {
  throw new Error('At least one GEMINI_API_KEY is required');
}

// Primary AI client
const genAI = new GoogleGenerativeAI(API_KEY || API_KEY_2!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Backup AI client (if second key is available)
const genAI2 = API_KEY_2 ? new GoogleGenerativeAI(API_KEY_2) : null;
const model2 = genAI2 ? genAI2.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }) : null;

// Enhanced model with retry logic
export async function generateContentWithRetry(prompt: string, maxRetries = 2): Promise<string> {
  let lastError: Error | null = null;
  
  // Try primary model first
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} with primary API key...`);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log('✅ Primary API key succeeded');
      return text;
    } catch (error) {
      console.log(`❌ Primary API attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Try backup model if available
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
        console.log(`❌ Backup API attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }
  
  throw lastError || new Error('All API attempts failed');
}

export { model, model2, genAI, genAI2 };