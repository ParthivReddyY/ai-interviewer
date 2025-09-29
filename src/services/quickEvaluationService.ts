'use server';

import { generateContentWithRetry } from './aiConfig';
import type { Question, Answer } from '@/types';


export async function quickEvaluate(
  question: Question,
  answer: Answer
): Promise<{ score: number; feedback: string; strengths: string[]; improvements: string[] }> {
  console.log(`⚡ Quick evaluation for question: ${question.text.substring(0, 50)}...`);
  
  try {
    const prompt = `Provide brief evaluation for this interview answer (1-10 scale):

QUESTION: "${question.text}"
ANSWER: "${answer.text}"
TIME: ${answer.timeSpent}s / ${question.timeLimit}s

Give quick feedback in JSON format:
{
  "score": 7,
  "feedback": "Brief 1-2 sentence evaluation",
  "strengths": ["one strength"],
  "improvements": ["one improvement tip"]
}`;

    const text = await generateContentWithRetry(prompt, 1); 
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    
    if (!jsonMatch) {
      return getQuickFallbackEvaluation(answer, question);
    }

    const evalData = JSON.parse(jsonMatch[0]);
    
    return {
      score: Math.max(1, Math.min(10, Number(evalData.score) || 5)),
      feedback: evalData.feedback || 'Good response!',
      strengths: Array.isArray(evalData.strengths) ? evalData.strengths.slice(0, 1) : ['Response provided'],
      improvements: Array.isArray(evalData.improvements) ? evalData.improvements.slice(0, 1) : ['Keep practicing']
    };

  } catch (error) {
    console.log('⚠️ Quick evaluation failed, using enhanced fallback:', error instanceof Error ? error.message : error);
    
    // Check if this is a service unavailability issue
    const isServiceUnavailable = error instanceof Error && 
      (error.message.includes('503') || error.message.includes('Service Unavailable'));
    
    if (isServiceUnavailable) {
      console.log('📡 AI service temporarily unavailable, using intelligent backup scoring');
    }
    
    return getQuickFallbackEvaluation(answer, question);
  }
}

function getQuickFallbackEvaluation(answer: Answer, question: Question): { score: number; feedback: string; strengths: string[]; improvements: string[] } {
  const wordCount = answer.text.split(/\s+/).filter(w => w.length > 2).length;
  const timeRatio = answer.timeSpent / question.timeLimit;
  const hasCode = /```|`\w+`|function|const|let|var|class/.test(answer.text);
  const hasTechnicalTerms = /(api|database|component|state|props|async|await|promise)/.test(answer.text.toLowerCase());
  
  let score = 5; 
  
  if (wordCount >= 30) score += 1.5;
  else if (wordCount >= 15) score += 1;
  else if (wordCount < 5) score -= 1;
  
  if (timeRatio <= 0.8) score += 0.5;
  else if (timeRatio > 1.2) score -= 0.5;
  
  if (hasCode) score += 1;
  if (hasTechnicalTerms) score += 0.5;
  
  if (question.difficulty === 'hard' && score > 6) score += 0.5;
  
  score = Math.max(1, Math.min(10, Math.round(score * 2) / 2)); 
  
  const feedback = score >= 8 ? 'Excellent answer with good technical depth!' :
                   score >= 6 ? 'Good response, shows understanding of the topic.' :
                   score >= 4 ? 'Decent attempt, consider adding more detail.' :
                   'Keep practicing - try to provide more comprehensive answers.';
  
  const strengths = score >= 7 ? ['Strong technical understanding'] :
                   score >= 5 ? ['Shows basic knowledge'] :
                   ['Attempted the question'];
  
  const improvements = score < 6 ? ['Add more technical detail and examples'] :
                      wordCount < 20 ? ['Expand your explanations'] :
                      ['Continue building on this foundation'];
  
  return { score, feedback, strengths, improvements };
}