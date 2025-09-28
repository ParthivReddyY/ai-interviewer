'use server';

import { 
  generateQuestions,
  evaluateAnswers,
  generateSummary,
  quickEvaluate,
  type ResumeData
} from '@/services';
import type { Question, Answer } from '@/types';


export async function generateQuestionsAction(
  candidateName: string,
  resumeContent?: string,
  resumeData?: ResumeData
): Promise<Question[]> {
  return await generateQuestions(candidateName, resumeContent, resumeData);
}


export async function evaluateAnswersAction(
  questions: Question[],
  answers: Answer[]
): Promise<{ overallScore: number; detailedFeedback: Answer[] }> {
  return await evaluateAnswers(questions, answers);
}


export async function generateSummaryAction(
  answers: Answer[],
  finalScore: number
): Promise<string> {
  return await generateSummary(answers, finalScore);
}


export async function quickEvaluateAction(
  question: Question,
  answer: Answer
): Promise<{ score: number; feedback: string; strengths: string[]; improvements: string[] }> {
  return await quickEvaluate(question, answer);
}


export async function parseResumeAction(resumeText: string): Promise<{
  name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: string;
  education?: string;
}> {
  const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
  
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : undefined;
  
  const phoneMatch = resumeText.match(/(\+?1?[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : undefined;
  
  const name = lines[0]?.length < 50 ? lines[0] : undefined;
  
  return {
    name,
    email,
    phone,
    skills: undefined,
    experience: undefined,
    education: undefined
  };
}