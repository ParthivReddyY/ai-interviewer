import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Question, Answer } from '@/types';
import type { ResumeData } from '@/utils/fileParser';

// Get API key from environment variables
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim() || '';

if (!API_KEY) {
  console.error('❌ Gemini API key not found!');
  console.log('Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file');
  console.log('Get your API key from: https://makersuite.google.com/app/apikey');
} else {
  console.log('✅ Gemini API key loaded successfully');
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
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-002' });
  }

  async generateQuestions(candidateName: string, resumeContent?: string, resumeData?: ResumeData): Promise<Question[]> {
    const maxRetries = 3;
    let lastError: Error | unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Enhanced resume context using structured data
        let resumeContext = '';
        
        if (resumeData) {
          const { skills, experience, education } = resumeData;
          resumeContext = `
            CANDIDATE PROFILE:
            Name: ${candidateName}
            ${skills && skills.length > 0 ? `Key Skills: ${skills.slice(0, 8).join(', ')}` : ''}
            ${experience ? `Experience: ${experience.slice(0, 300)}` : ''}
            ${education ? `Education: ${education.slice(0, 200)}` : ''}
            
            CUSTOMIZATION INSTRUCTIONS:
            - Tailor 2-3 questions based on the candidate's skill set
            - Include questions about technologies they've mentioned
            - Ask about their experience level appropriately
            - Keep standard technical coverage for comprehensive evaluation
          `;
        } else if (resumeContent) {
          resumeContext = `
            Resume Context: ${resumeContent.slice(0, 800)}...
            
            Tailor some questions to the candidate's background while maintaining technical coverage.
          `;
        }

        const prompt = `
          You are an expert technical interviewer for a leading tech company. Generate 6 exceptional technical interview questions for a full-stack developer position.
          
          ${resumeContext}
          
          STRICT DIFFICULTY DISTRIBUTION:
          - 2 EASY questions (20 seconds): Basic concepts, syntax, definitions
          - 2 MEDIUM questions (60 seconds): Practical implementation, problem-solving  
          - 2 HARD questions (120 seconds): Complex architecture, optimization, advanced concepts

          COMPREHENSIVE TOPIC COVERAGE (mandatory variety):
          1. **JavaScript/TypeScript**: ES6+ features, closures, prototypes, async patterns, type systems
          2. **React/Frontend**: Hooks, state management, performance optimization, SSR/SSG
          3. **Node.js/Backend**: APIs, middleware, authentication, microservices
          4. **Database**: SQL/NoSQL design, indexing, transactions, scaling
          5. **System Design**: Architecture patterns, scalability, caching, monitoring
          6. **Algorithms/Problem-Solving**: Data structures, complexity, optimization

          ENHANCED QUALITY STANDARDS:
          - Each question must include realistic business context
          - Require both theoretical knowledge AND practical application
          - Include specific scenarios that test decision-making skills
          - Allow for multiple valid approaches to demonstrate thinking depth
          - Be precise enough to enable objective evaluation
          - Test understanding of trade-offs and best practices

          RETURN ONLY VALID JSON in this EXACT format:
          [
            {
              "text": "Detailed scenario-based question with clear context, requirements, and success criteria",
              "difficulty": "easy|medium|hard",
              "category": "javascript|react|nodejs|database|system-design|algorithms"
            }
          ]

          CANDIDATE: ${candidateName}
          
          CRITICAL: Ensure perfect JSON syntax. No explanatory text outside the JSON array.
        `;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Enhanced JSON extraction with multiple patterns
        let jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          // Try to find JSON within code blocks
          jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
          if (jsonMatch) {
            jsonMatch[0] = jsonMatch[1];
          }
        }
        
        if (!jsonMatch) {
          throw new Error('Failed to parse questions from AI response');
        }

        const questionsData = JSON.parse(jsonMatch[0]);
        
        // Validate and enhance questions
        const validQuestions = questionsData.map((q: { text: string; difficulty: string; category?: string }, index: number) => ({
          id: `q_${Date.now()}_${index}`,
          text: q.text.trim(),
          difficulty: (q.difficulty?.toLowerCase() as 'easy' | 'medium' | 'hard') || 'medium',
          category: q.category || 'general',
          timeLimit: DIFFICULTY_CONFIG[q.difficulty?.toLowerCase() as keyof typeof DIFFICULTY_CONFIG]?.timeLimit || 60,
        }));

        // Return if successful
        if (validQuestions.length > 0) {
          return validQuestions;
        }
      } catch (error) {
        console.error(`Error generating questions (attempt ${attempt}/${maxRetries}):`, error);
        lastError = error;
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    console.error('All attempts to generate questions failed, using fallback questions');
    console.error('Last error:', lastError);
    return this.getFallbackQuestions();
  }

  // Remove immediate evaluation - just store the answer
  async evaluateAnswer(): Promise<{ score: number; feedback: string; strengths: string[]; improvements: string[] }> {
    return {
      score: 0, // Will be calculated at the end
      feedback: 'Answer recorded. Evaluation will be provided after the interview.',
      strengths: [],
      improvements: []
    };
  }

  // New method to evaluate all answers at the end
  async evaluateAllAnswers(questions: Question[], answers: Answer[]): Promise<{ overallScore: number; detailedFeedback: Answer[] }> {
    const evaluatedAnswers: Answer[] = [];
    const scores: number[] = [];

    for (let i = 0; i < answers.length; i++) {
      const question = questions[i];
      const answer = answers[i];
      
      try {
        const evaluation = await this.evaluateSingleAnswer(question, answer);
        evaluatedAnswers.push({
          ...answer,
          score: evaluation.score,
          feedback: evaluation.feedback,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements
        });
        scores.push(evaluation.score);
      } catch (error) {
        console.error(`Error evaluating answer ${i + 1}:`, error);
        // Fallback evaluation
        const fallbackScore = this.getFallbackScore(answer, question);
        evaluatedAnswers.push({
          ...answer,
          score: fallbackScore,
          feedback: 'Answer recorded. Detailed evaluation not available.',
          strengths: ['Provided a response'],
          improvements: ['More detailed explanation would help']
        });
        scores.push(fallbackScore);
      }
    }

    const overallScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    return {
      overallScore: Math.round(overallScore * 10) / 10,
      detailedFeedback: evaluatedAnswers
    };
  }

  private async evaluateSingleAnswer(question: Question, answer: Answer): Promise<{ score: number; feedback: string; strengths: string[]; improvements: string[] }> {
    const prompt = `
      You are a senior technical interviewer. Evaluate this ${question.difficulty.toUpperCase()} level answer in the ${question.category || 'general'} domain.
      
      QUESTION: ${question.text}
      
      CANDIDATE RESPONSE: ${answer.text}
      
      TIME USED: ${answer.timeSpent}s (limit: ${question.timeLimit}s)
      
      Provide evaluation as JSON:
      {
        "score": number (0-10),
        "feedback": "Detailed feedback explaining the score",
        "strengths": ["strength 1", "strength 2"],
        "improvements": ["improvement 1", "improvement 2"]
      }
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonMatch[0] = jsonMatch[1];
      }
    }
    
    if (!jsonMatch) {
      throw new Error('Failed to parse evaluation from AI response');
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    
    // Apply time bonus/penalty
    const timeRatio = answer.timeSpent / question.timeLimit;
    const timeAdjustment = timeRatio <= 1 ? 0.5 : -Math.min(1, (timeRatio - 1) * 0.5);
    const finalScore = Math.max(0, Math.min(10, evaluation.score + timeAdjustment));
    
    return {
      score: Math.round(finalScore * 10) / 10,
      feedback: evaluation.feedback || 'Good effort on this question.',
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || []
    };
  }

  private getFallbackScore(answer: Answer, question: Question): number {
    const wordCount = answer.text.split(/\s+/).length;
    const hasCodeExample = /```|`\w+`|function|const|let|var|class/.test(answer.text);
    const hasSpecificTerms = /(API|database|component|state|props|async|await|promise)/.test(answer.text.toLowerCase());
    
    let fallbackScore = Math.min(6, wordCount / 10);
    if (hasCodeExample) fallbackScore += 1;  
    if (hasSpecificTerms) fallbackScore += 1;
    if (answer.timeSpent <= question.timeLimit) fallbackScore += 0.5;
    
    return Math.min(10, fallbackScore);
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
      console.error('Error generating final summary:', error);
      return `Interview completed with an overall score of ${finalScore}/10. Thank you for your participation.`;
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