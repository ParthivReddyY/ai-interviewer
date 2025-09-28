'use server';

import { generateContentWithRetry } from './aiConfig';
import type { Answer } from '@/types';

export async function generateSummary(
  answers: Answer[],
  finalScore: number
): Promise<string> {
  console.log(`🤖 Generating summary (${finalScore}/10)`);
  
  try {
    const prompt = `Write a professional interview summary.

Score: ${finalScore}/10
Questions: ${answers.length}
Scores: ${answers.map(a => a.score || 0).join(', ')}

Create 2-3 paragraphs covering:
1. Overall performance
2. Key strengths
3. Areas for improvement
4. Recommendation`;

    const summary = await generateContentWithRetry(prompt);
    
    console.log('✅ Summary generated');
    return summary;

  } catch (error) {
    console.error('❌ Summary generation failed:', error);
    return `Interview completed with score ${finalScore}/10. Candidate answered ${answers.length} questions. ${finalScore >= 6 ? 'Good performance demonstrated.' : 'Additional preparation recommended.'}`;
  }
}