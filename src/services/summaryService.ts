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
    
    // Check if this is a service unavailability issue
    const isServiceUnavailable = error instanceof Error && 
      (error.message.includes('503') || error.message.includes('Service Unavailable'));
    
    const fallbackSummary = generateFallbackSummary(answers, finalScore, isServiceUnavailable);
    return fallbackSummary;
  }
}

function generateFallbackSummary(answers: Answer[], finalScore: number, isServiceUnavailable: boolean): string {
  const questionsCount = answers.length;
  const averageScore = finalScore;
  const totalTimeSpent = answers.reduce((acc, ans) => acc + ans.timeSpent, 0);
  const avgTimePerQuestion = Math.round(totalTimeSpent / questionsCount);
  
  // Analyze answer quality
  const scores = answers.map(a => a.score || 0);
  const highScores = scores.filter(s => s >= 7).length;
  const lowScores = scores.filter(s => s < 5).length;
  
  // Generate contextual summary
  let performanceLevel = '';
  let recommendation = '';
  
  if (averageScore >= 8) {
    performanceLevel = 'Outstanding performance with excellent technical depth and understanding.';
    recommendation = 'Strong candidate with comprehensive knowledge. Highly recommended for technical roles.';
  } else if (averageScore >= 6.5) {
    performanceLevel = 'Good performance demonstrating solid technical competency.';
    recommendation = 'Capable candidate with good technical foundation. Recommended for most technical positions.';
  } else if (averageScore >= 5) {
    performanceLevel = 'Adequate performance with room for technical improvement.';
    recommendation = 'Shows potential but would benefit from additional technical development and preparation.';
  } else {
    performanceLevel = 'Performance indicates need for significant technical development.';
    recommendation = 'Extensive preparation and skill development recommended before pursuing technical roles.';
  }
  
  const serviceNote = isServiceUnavailable 
    ? '\n\n*Note: AI service was temporarily unavailable during evaluation. This summary was generated using enhanced fallback analysis.*'
    : '';
  
  return `**INTERVIEW PERFORMANCE SUMMARY**

**Overall Assessment:** ${performanceLevel}

**Key Metrics:**
• Final Score: ${finalScore.toFixed(1)}/10
• Questions Completed: ${questionsCount}
• Average Time per Question: ${avgTimePerQuestion} seconds
• Strong Responses: ${highScores}/${questionsCount}
• Responses Needing Improvement: ${lowScores}/${questionsCount}

**Performance Analysis:**
${averageScore >= 7 
  ? 'Candidate demonstrated strong technical knowledge with well-structured responses and appropriate use of technical concepts.'
  : averageScore >= 5
  ? 'Candidate showed basic technical understanding but responses could benefit from more depth and specific examples.'
  : 'Candidate needs significant improvement in technical knowledge and problem-solving approach.'
}

**Areas of Strength:**
${highScores > 0 
  ? `• Performed well on ${highScores} questions, showing good technical comprehension`
  : '• Attempted all questions with basic understanding'
}
• Completed interview within reasonable time frame
${averageScore >= 6 ? '• Demonstrated problem-solving abilities' : ''}

**Areas for Improvement:**
${lowScores > 0 
  ? `• ${lowScores} responses need significant improvement in technical depth`
  : ''
}
• Focus on providing more detailed technical explanations
• Practice with specific examples and code implementations
• Strengthen fundamental technical concepts

**Recommendation:** ${recommendation}${serviceNote}`;
}