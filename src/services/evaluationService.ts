'use server';

import { generateContentWithRetry } from './aiConfig';
import type { Question, Answer } from '@/types';

export async function evaluateAnswers(
  questions: Question[],
  answers: Answer[]
): Promise<{ overallScore: number; detailedFeedback: Answer[] }> {
  console.log(`🤖 Batch evaluating ${answers.length} answers in single API call`);
  
  try {
    const batchEvaluation = await evaluateAnswersBatch(questions, answers);
    
    if (batchEvaluation) {
      console.log(`✅ Batch evaluation complete: ${batchEvaluation.overallScore}/10`);
      return batchEvaluation;
    }
    
    console.log('⚠️ Batch evaluation failed, falling back to individual evaluation');
    return await evaluateAnswersIndividual(questions, answers);

  } catch (error) {
    console.error('❌ Evaluation failed:', error);
    
    const isServiceUnavailable = error instanceof Error && 
      (error.message.includes('503') || 
       error.message.includes('Service Unavailable') ||
       error.message.includes('quota exceeded') ||
       error.message.includes('Too Many Requests') ||
       error.message.includes('429'));
    
    if (isServiceUnavailable) {
      console.log('📡 AI service quota exhausted or temporarily unavailable, using enhanced fallback evaluation');
    }
    
    return getFallbackEvaluation(answers, isServiceUnavailable);
  }
}

async function evaluateAnswersBatch(
  questions: Question[],
  answers: Answer[]
): Promise<{ overallScore: number; detailedFeedback: Answer[] } | null> {
  try {
    const evaluationData = answers.map((answer, index) => {
      const question = questions.find(q => q.id === answer.questionId) || questions[index];
      return {
        questionId: index + 1,
        question: question?.text || 'Question not found',
        answer: answer.text || '',
        timeSpent: answer.timeSpent || 0,
        timeLimit: question?.timeLimit || 60,
        difficulty: question?.difficulty || 'medium',
        category: question?.category || 'General'
      };
    });

    const prompt = `Evaluate all ${answers.length} interview answers in batch (1-10 scale each):

${evaluationData.map(item => `
QUESTION ${item.questionId}: "${item.question.replace(/"/g, "'")}"
ANSWER ${item.questionId}: "${item.answer.replace(/"/g, "'")}"
TIME: ${item.timeSpent}s/${item.timeLimit}s
DIFFICULTY: ${item.difficulty}
CATEGORY: ${item.category}
`).join('\n')}

Return ONLY valid JSON with this exact structure (NO extra text, NO markdown):
{
  "evaluations": [
    {
      "score": 7,
      "feedback": "Brief evaluation feedback",
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    }
  ],
  "overallScore": 7.2
}

Provide exactly ${answers.length} evaluations in the evaluations array, one for each question in order. Ensure valid JSON syntax.`;

    const text = await generateContentWithRetry(prompt, 1);
    
    // More robust JSON extraction
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in batch evaluation response');
    }
    
    jsonText = jsonMatch[0];
    
    // Clean up common JSON issues
    jsonText = jsonText
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to unquoted keys
      .replace(/:\s*'([^']*)'/g, ': "$1"') // Convert single quotes to double quotes
      .replace(/\n/g, ' ') // Remove newlines that might break JSON
      .replace(/\s+/g, ' '); // Normalize whitespace

    let batchData;
    try {
      batchData = JSON.parse(jsonText);
    } catch (parseError) {
      console.log('❌ JSON parse error:', parseError);
      console.log('📄 Problematic JSON:', jsonText.substring(0, 500));
      throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
    
    if (!batchData.evaluations || !Array.isArray(batchData.evaluations) || 
        batchData.evaluations.length !== answers.length) {
      throw new Error('Invalid batch evaluation format');
    }

    const evaluated: Answer[] = answers.map((answer, index) => {
      const evaluation = batchData.evaluations[index];
      return {
        ...answer,
        score: Math.max(1, Math.min(10, Number(evaluation.score) || 5)),
        feedback: evaluation.feedback || 'Answer evaluated.',
        strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths.slice(0, 3) : ['Good effort'],
        improvements: Array.isArray(evaluation.improvements) ? evaluation.improvements.slice(0, 3) : ['Add more detail']
      };
    });

    const calculatedOverallScore = evaluated.reduce((sum, ans) => sum + (ans.score || 0), 0) / evaluated.length;
    const overallScore = Math.round(calculatedOverallScore * 100) / 100;

    return {
      overallScore,
      detailedFeedback: evaluated
    };

  } catch (error) {
    console.log('⚠️ Batch evaluation failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function evaluateAnswersIndividual(
  questions: Question[],
  answers: Answer[]
): Promise<{ overallScore: number; detailedFeedback: Answer[] }> {
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
  
  return {
    overallScore,
    detailedFeedback: evaluated
  };
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
    const wordCount = answer.text.split(/\s+/).filter(w => w.length > 2).length;
    const hasCode = /```|`\w+`|function|const|let|var|class/.test(answer.text);
    const hasTechnicalTerms = /(api|database|component|state|props|async|await|promise|server|client|framework|library|algorithm|data|structure|security|performance|optimization|design|pattern|architecture|testing|deployment|scaling|monitoring|debugging|error|handling|validation|authentication|authorization|http|rest|graphql|json|xml|html|css|javascript|typescript|python|java|react|vue|angular|node|express|django|flask|spring|kubernetes|docker|aws|azure|gcp|git|ci\/cd|agile|scrum|devops)/i.test(answer.text);
    const questionLength = answer.text.length;
    
    let score = 5; 
    
    if (wordCount >= 50) score += 2;
    else if (wordCount >= 30) score += 1.5;
    else if (wordCount >= 15) score += 1;
    else if (wordCount < 5) score -= 2;
    
    if (hasCode) score += 1.5;
    
    if (hasTechnicalTerms) score += 1;
    
    if (questionLength > 200) score += 0.5;
    
    const timeRatio = answer.timeSpent / (answer.timeSpent + 60); 
    if (timeRatio < 0.5) score += 0.5; 
    else if (timeRatio > 0.9) score -= 0.5; 
    
    score = Math.max(1, Math.min(10, Math.round(score * 2) / 2));
    
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