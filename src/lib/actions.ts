'use server';

import { 
  generateQuestions,
  evaluateAnswers,
  generateSummary,
  quickEvaluate,
  type ResumeData
} from '@/services';
import type { Question, Answer } from '@/types';

/**
 * Server action for generating interview questions using AI
 */
export async function generateQuestionsAction(
  candidateName: string,
  resumeContent?: string,
  resumeData?: ResumeData
): Promise<Question[]> {
  return await generateQuestions(candidateName, resumeContent, resumeData);
}

/**
 * Server action for evaluating interview answers using AI
 */
export async function evaluateAnswersAction(
  questions: Question[],
  answers: Answer[]
): Promise<{ overallScore: number; detailedFeedback: Answer[] }> {
  return await evaluateAnswers(questions, answers);
}

/**
 * Server action for generating interview summary using AI
 */
export async function generateSummaryAction(
  answers: Answer[],
  finalScore: number
): Promise<string> {
  return await generateSummary(answers, finalScore);
}

/**
 * Server action for quick evaluation of a single answer
 */
export async function quickEvaluateAction(
  question: Question,
  answer: Answer
): Promise<{ score: number; feedback: string; strengths: string[]; improvements: string[] }> {
  return await quickEvaluate(question, answer);
}

/**
 * Server action for parsing resume content (client-side parsing is preferred)
 */
export async function parseResumeAction(resumeText: string): Promise<{
  name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: string;
  education?: string;
}> {
  // This is a simple fallback - client-side parsing is preferred
  const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
  
  // Basic email extraction
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : undefined;
  
  // Basic phone extraction  
  const phoneMatch = resumeText.match(/(\+?1?[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : undefined;
  
  // Try to get name from first line
  const name = lines[0]?.length < 50 ? lines[0] : undefined;
  
  return {
    name,
    email,
    phone,
    // These would require more sophisticated parsing
    skills: undefined,
    experience: undefined,
    education: undefined
  };
}