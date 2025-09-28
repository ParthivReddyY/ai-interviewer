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
    return getFallbackEvaluation(answers);
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

function getFallbackEvaluation(answers: Answer[]): { overallScore: number; detailedFeedback: Answer[] } {
  const evaluated = answers.map(answer => {
    const score = Math.max(1, Math.min(10, answer.text.length / 15));
    return {
      ...answer,
      score,
      feedback: 'Answer evaluated using fallback scoring.',
      strengths: ['Response provided'],
      improvements: ['Add more technical detail']
    };
  });

  const overallScore = evaluated.reduce((sum, a) => sum + (a.score || 0), 0) / answers.length;

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    detailedFeedback: evaluated
  };
}