import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Question, Answer } from '@/types';

// Note: In a real application, this should be stored in environment variables
// For development, you'll need to set your Gemini API key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

if (!API_KEY && typeof window !== 'undefined') {
  console.warn('Gemini API key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

const DIFFICULTY_CONFIG = {
  easy: { timeLimit: 20, count: 2 },
  medium: { timeLimit: 60, count: 2 },
  hard: { timeLimit: 120, count: 2 },
} as const;

export class AIService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateQuestions(candidateName: string): Promise<Question[]> {
    try {
      const prompt = `
        Generate 6 technical interview questions for a full-stack developer role (React/Node.js).
        The questions should be distributed as follows:
        - 2 Easy questions (should take ~20 seconds to answer)
        - 2 Medium questions (should take ~60 seconds to answer)  
        - 2 Hard questions (should take ~120 seconds to answer)

        Topics should cover:
        - React fundamentals and hooks
        - JavaScript/TypeScript concepts
        - Node.js and backend development
        - Database design and queries
        - System design and architecture
        - Problem-solving and algorithms

        Return the response as a JSON array where each question has this structure:
        {
          "text": "The question text",
          "difficulty": "easy|medium|hard"
        }

        Candidate name: ${candidateName}
        
        Make sure questions are practical and relevant to real-world development scenarios.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse questions from AI response');
      }

      const questionsData = JSON.parse(jsonMatch[0]);
      
      return questionsData.map((q: { text: string; difficulty: string }, index: number) => ({
        id: `q_${Date.now()}_${index}`,
        text: q.text,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        timeLimit: DIFFICULTY_CONFIG[q.difficulty as keyof typeof DIFFICULTY_CONFIG].timeLimit,
      }));
    } catch (error) {
      console.error('Error generating questions:', error);
      // Fallback questions if AI fails
      return this.getFallbackQuestions();
    }
  }

  async evaluateAnswer(question: Question, answer: Answer): Promise<{ score: number; feedback: string }> {
    try {
      const prompt = `
        Evaluate this interview answer on a scale of 0-10:
        
        Question (${question.difficulty}): ${question.text}
        
        Answer: ${answer.text}
        Time spent: ${answer.timeSpent} seconds (limit was ${question.timeLimit} seconds)
        
        Provide scoring based on:
        - Technical accuracy (40%)
        - Completeness of answer (30%)
        - Code quality if applicable (20%)
        - Communication clarity (10%)
        
        Return response as JSON:
        {
          "score": number (0-10),
          "feedback": "Brief constructive feedback (2-3 sentences)"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse evaluation from AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error evaluating answer:', error);
      // Fallback scoring
      return {
        score: answer.text.length > 10 ? 5 : 2,
        feedback: 'Unable to provide detailed feedback at this time.',
      };
    }
  }

  async generateFinalSummary(answers: Answer[], finalScore: number): Promise<string> {
    try {
      const prompt = `
        Generate a brief interview summary for a candidate who scored ${finalScore}/10 overall.
        
        Number of questions answered: ${answers.length}
        Individual scores: ${answers.map(a => a.score || 0).join(', ')}
        
        Provide a 2-3 sentence summary highlighting:
        - Overall performance level
        - Key strengths observed
        - Areas for improvement (if applicable)
        
        Keep it professional and constructive.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      return `Candidate completed ${answers.length} questions with an overall score of ${finalScore}/10. Performance assessment unavailable due to technical issues.`;
    }
  }

  private getFallbackQuestions(): Question[] {
    const fallbackQuestions = [
      {
        id: 'fallback_1',
        text: 'What is the difference between let, const, and var in JavaScript?',
        difficulty: 'easy' as const,
        timeLimit: 20,
      },
      {
        id: 'fallback_2',
        text: 'Explain the concept of React hooks and give an example.',
        difficulty: 'easy' as const,
        timeLimit: 20,
      },
      {
        id: 'fallback_3',
        text: 'How would you optimize a slow-running React component?',
        difficulty: 'medium' as const,
        timeLimit: 60,
      },
      {
        id: 'fallback_4',
        text: 'Describe the event loop in Node.js and how it handles asynchronous operations.',
        difficulty: 'medium' as const,
        timeLimit: 60,
      },
      {
        id: 'fallback_5',
        text: 'Design a scalable architecture for a real-time chat application.',
        difficulty: 'hard' as const,
        timeLimit: 120,
      },
      {
        id: 'fallback_6',
        text: 'How would you implement authentication and authorization in a full-stack application?',
        difficulty: 'hard' as const,
        timeLimit: 120,
      },
    ];

    return fallbackQuestions;
  }
}

export const aiService = new AIService();