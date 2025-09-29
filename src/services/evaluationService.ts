'use server';

import { generateContentWithRetry } from './aiConfig';
import type { Question, Answer } from '@/types';

export async function evaluateAnswers(
  questions: Question[],
  answers: Answer[]
): Promise<{ overallScore: number; detailedFeedback: Answer[] }> {
  console.log(`🤖 Evaluating ${answers.length} answers`);
  
  try {
    const evaluated: Answer[] = [];
    let total = 0;

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const question = questions.find(q => q.id === answer.questionId);
      
      if (!question) {
        const score = Math.max(1, Math.min(10, answer.text.length / 20));
        evaluated.push({
          ...answer,
          score,
          feedback: 'Answer recorded.',
          strengths: ['Response provided'],
          improvements: ['Add more detail']
        });
        total += score;
        continue;
      }

      try {
        const evaluation = await evaluateAnswer(question, answer);
        evaluated.push({ ...answer, ...evaluation });
        total += evaluation.score;
      } catch (err) {
        console.error(`Error evaluating answer ${i + 1}:`, err);
        const score = Math.max(1, Math.min(10, answer.text.length / 15));
        evaluated.push({
          ...answer,
          score,
          feedback: 'Answer evaluated with basic scoring.',
          strengths: ['Response provided'],
          improvements: ['Consider more examples']
        });
        total += score;
      }
    }

    const overallScore = Math.round((total / answers.length) * 100) / 100;
    
    console.log(`✅ Evaluation complete: ${overallScore}/10`);
    return {
      overallScore,
      detailedFeedback: evaluated
    };

  } catch (error) {
    console.error('❌ Evaluation failed:', error);
    
    // Check if this is a service unavailability issue
    const isServiceUnavailable = error instanceof Error && 
      (error.message.includes('503') || error.message.includes('Service Unavailable'));
    
    if (isServiceUnavailable) {
      console.log('📡 AI service temporarily unavailable, using comprehensive backup evaluation');
    }
    
    return getFallbackEvaluation(answers, isServiceUnavailable);
  }
}

async function evaluateAnswer(
  question: Question,
  answer: Answer
): Promise<{ score: number; feedback: string; strengths: string[]; improvements: string[] }> {
  const prompt = `Evaluate this answer (1-10 scale):

Question: "${question.text}"
Answer: "${answer.text}"
Time: ${answer.timeSpent}s/${question.timeLimit}s

Return JSON:
{
  "score": 7,
  "feedback": "feedback here",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}`;

  const text = await generateContentWithRetry(prompt);
  
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  
  if (!jsonMatch) {
    throw new Error('No JSON in evaluation');
  }

  const evalData = JSON.parse(jsonMatch[0]);
  
  return {
    score: Math.max(1, Math.min(10, Number(evalData.score) || 5)),
    feedback: evalData.feedback || 'Answer evaluated.',
    strengths: Array.isArray(evalData.strengths) ? evalData.strengths.slice(0, 3) : ['Good effort'],
    improvements: Array.isArray(evalData.improvements) ? evalData.improvements.slice(0, 3) : ['Add more detail']
  };
}

function getFallbackEvaluation(answers: Answer[], isServiceUnavailable = false): { overallScore: number; detailedFeedback: Answer[] } {
  const evaluated = answers.map((answer) => {
    // Enhanced fallback scoring based on answer content analysis
    const wordCount = answer.text.split(/\s+/).filter(w => w.length > 2).length;
    const hasCode = /```|`\w+`|function|const|let|var|class/.test(answer.text);
    const hasTechnicalTerms = /(api|database|component|state|props|async|await|promise|server|client|framework|library|algorithm|data|structure|security|performance|optimization|design|pattern|architecture|testing|deployment|scaling|monitoring|debugging|error|handling|validation|authentication|authorization|http|rest|graphql|json|xml|html|css|javascript|typescript|python|java|react|vue|angular|node|express|django|flask|spring|kubernetes|docker|aws|azure|gcp|git|ci\/cd|agile|scrum|devops)/i.test(answer.text);
    const questionLength = answer.text.length;
    
    let score = 5; // Base score
    
    // Adjust based on content quality
    if (wordCount >= 50) score += 2;
    else if (wordCount >= 30) score += 1.5;
    else if (wordCount >= 15) score += 1;
    else if (wordCount < 5) score -= 2;
    
    // Bonus for code examples
    if (hasCode) score += 1.5;
    
    // Bonus for technical terminology
    if (hasTechnicalTerms) score += 1;
    
    // Bonus for comprehensive answers
    if (questionLength > 200) score += 0.5;
    
    // Time efficiency factor
    const timeRatio = answer.timeSpent / (answer.timeSpent + 60); // Assuming reasonable time limit
    if (timeRatio < 0.5) score += 0.5; // Finished quickly
    else if (timeRatio > 0.9) score -= 0.5; // Took too long
    
    // Cap the score between 1 and 10
    score = Math.max(1, Math.min(10, Math.round(score * 2) / 2)); // Round to nearest 0.5
    
    const feedback = isServiceUnavailable 
      ? `AI service temporarily unavailable. Score calculated using intelligent backup analysis: ${getScoreFeedback(score)}`
      : `Answer evaluated using enhanced fallback analysis: ${getScoreFeedback(score)}`;
    
    const strengths = getStrengths(score, hasCode, hasTechnicalTerms, wordCount);
    const improvements = getImprovements(score, wordCount, hasCode, hasTechnicalTerms);
    
    return {
      ...answer,
      score,
      feedback,
      strengths,
      improvements
    };
  });

  const overallScore = evaluated.reduce((sum, a) => sum + (a.score || 0), 0) / answers.length;

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    detailedFeedback: evaluated
  };
}

function getScoreFeedback(score: number): string {
  if (score >= 8.5) return 'Excellent technical depth and understanding demonstrated.';
  if (score >= 7) return 'Strong technical knowledge with good explanations.';
  if (score >= 5.5) return 'Good understanding with room for more detail.';
  if (score >= 4) return 'Basic understanding shown, needs more technical depth.';
  return 'Consider providing more comprehensive technical explanations.';
}

function getStrengths(score: number, hasCode: boolean, hasTechnical: boolean, wordCount: number): string[] {
  const strengths: string[] = [];
  
  if (score >= 7) strengths.push('Strong technical understanding');
  if (hasCode) strengths.push('Provided code examples');
  if (hasTechnical) strengths.push('Used appropriate technical terminology');
  if (wordCount >= 30) strengths.push('Comprehensive response');
  if (score >= 6) strengths.push('Good problem-solving approach');
  
  return strengths.length > 0 ? strengths : ['Answer provided'];
}

function getImprovements(score: number, wordCount: number, hasCode: boolean, hasTechnical: boolean): string[] {
  const improvements: string[] = [];
  
  if (score < 6) improvements.push('Add more technical detail and depth');
  if (wordCount < 20) improvements.push('Expand explanations with more examples');
  if (!hasCode && score < 8) improvements.push('Consider including code examples');
  if (!hasTechnical) improvements.push('Use more specific technical terminology');
  if (score < 5) improvements.push('Focus on demonstrating practical knowledge');
  
  return improvements.length > 0 ? improvements : ['Continue building technical skills'];
}