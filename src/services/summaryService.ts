'use server';

import { generateContentWithRetry } from './aiConfig';
import type { Answer } from '@/types';

export async function generateSummary(
  answers: Answer[],
  finalScore: number
): Promise<string> {
  console.log(`🤖 Generating summary (${finalScore}/10)`);
  
  // If we have a good fallback analysis, use it to save API calls
  const hasGoodFeedback = answers.some(a => a.feedback && a.feedback.length > 50 && !a.feedback.includes('Answer recorded'));
  
  if (!hasGoodFeedback || finalScore === 0) {
    console.log('📋 Using intelligent summary generation (saving API call)');
    return generateFallbackSummary(answers, finalScore, false);
  }
  
  try {
    const prompt = `Write a professional interview summary based on the evaluation results.

Final Score: ${finalScore}/10
Total Questions: ${answers.length}
Individual Scores: ${answers.map(a => a.score || 0).join(', ')}

Key Feedback Points:
${answers.map((a, i) => `Q${i+1}: ${a.feedback?.substring(0, 100) || 'No feedback'}`).join('\n')}

Create a concise 2-3 paragraph professional summary covering:
1. Overall performance assessment
2. Key technical strengths demonstrated
3. Areas for improvement
4. Final recommendation for hiring consideration

Keep it professional and specific to the candidate's responses.`;

    const summary = await generateContentWithRetry(prompt, 1); // Only 1 retry for summary
    
    console.log('✅ AI summary generated');
    return summary;

  } catch (error) {
    console.error('❌ Summary generation failed:', error);
    
    // Check if this is a service unavailability issue
    const isServiceUnavailable = error instanceof Error && 
      (error.message.includes('503') || 
       error.message.includes('Service Unavailable') ||
       error.message.includes('quota exceeded') ||
       error.message.includes('Too Many Requests') ||
       error.message.includes('429'));
    
    console.log('📋 Using enhanced fallback summary generation');
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