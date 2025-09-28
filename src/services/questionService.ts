'use server';

import { generateContentWithRetry } from './aiConfig';
import type { Question } from '@/types';
import type { ResumeData } from './types';

export async function generateQuestions(
  candidateName: string,
  resumeContent?: string,
  resumeData?: ResumeData
): Promise<Question[]> {
  console.log('🤖 Generating AI questions for:', candidateName);
  
  try {
    let context = `Generate 6 interview questions for ${candidateName}.`;
    
    if (resumeData?.skills?.length) {
      context += ` Skills: ${resumeData.skills.slice(0, 5).join(', ')}.`;
    }

    const sessionId = Math.random().toString(36).substring(2, 8);
    
    const prompt = `${context}

SESSION INFO: Interview #${sessionId} at ${new Date().toLocaleString()}

Create exactly 6 UNIQUE technical interview questions that are DIFFERENT from typical standard questions:
- 2 easy questions (20 seconds each) - Focus on practical basics
- 2 medium questions (60 seconds each) - Problem-solving scenarios  
- 2 hard questions (120 seconds each) - Complex architecture/design

VARIETY REQUIREMENTS:
- Avoid repetitive patterns
- Mix theoretical and practical questions
- Include scenario-based questions
- Cover different technology areas
- Make questions specific and actionable

CATEGORIES TO VARY: Frontend, Backend, Database, System Design, Algorithms, Security, Performance, DevOps

Return ONLY valid JSON array:
[
  {"text": "Detailed scenario-based question with specific context", "difficulty": "easy", "category": "Frontend"},
  {"text": "Problem-solving question with real-world application", "difficulty": "medium", "category": "Backend"},
  {"text": "Complex design question requiring trade-off analysis", "difficulty": "hard", "category": "System Design"}
]`;

    const text = await generateContentWithRetry(prompt);
    
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    
    if (!jsonMatch) {
      console.log('⚠️ No JSON found, using fallback');
      return getFallbackQuestions();
    }

    const data = JSON.parse(jsonMatch[0]);
    
    const questions: Question[] = data.map((q: { text?: string; difficulty?: string; category?: string }, i: number) => ({
      id: `ai_${Date.now()}_${i}`,
      text: q.text || `Question ${i + 1}`,
      difficulty: q.difficulty || 'medium',
      timeLimit: q.difficulty === 'easy' ? 20 : q.difficulty === 'hard' ? 120 : 60,
      category: q.category || 'General'
    }));

    const final = questions.slice(0, 6);
    while (final.length < 6) {
      final.push(getFallbackQuestion(final.length));
    }

    console.log(`✅ Generated ${final.length} questions successfully`);
    return final;

  } catch (error) {
    console.error('❌ AI generation failed:', error);
    return getFallbackQuestions();
  }
}

function getFallbackQuestions(): Question[] {
  const allQuestions = [
    // Easy questions
    {
      id: 'fallback_easy_1',
      text: 'Explain the difference between let, const, and var in JavaScript.',
      difficulty: 'easy' as const,
      timeLimit: 20,
      category: 'JavaScript'
    },
    {
      id: 'fallback_easy_2',
      text: 'What are React hooks and how do you use useState?',
      difficulty: 'easy' as const,
      timeLimit: 20,
      category: 'React'
    },
    {
      id: 'fallback_easy_3',
      text: 'What is the difference between == and === in JavaScript?',
      difficulty: 'easy' as const,
      timeLimit: 20,
      category: 'JavaScript'
    },
    {
      id: 'fallback_easy_4',
      text: 'Explain what CSS flexbox is and give a practical example.',
      difficulty: 'easy' as const,
      timeLimit: 20,
      category: 'Frontend'
    },
    // Medium questions
    {
      id: 'fallback_medium_1',
      text: 'How would you optimize a slow database query?',
      difficulty: 'medium' as const,
      timeLimit: 60,
      category: 'Database'
    },
    {
      id: 'fallback_medium_2',
      text: 'Explain how you implement user authentication in a web application.',
      difficulty: 'medium' as const,
      timeLimit: 60,
      category: 'Security'
    },
    {
      id: 'fallback_medium_3',
      text: 'Describe how you would handle error handling in a REST API.',
      difficulty: 'medium' as const,
      timeLimit: 60,
      category: 'Backend'
    },
    {
      id: 'fallback_medium_4',
      text: 'How would you implement real-time updates in a web application?',
      difficulty: 'medium' as const,
      timeLimit: 60,
      category: 'Frontend'
    },
    // Hard questions
    {
      id: 'fallback_hard_1',
      text: 'Design a scalable chat application architecture for 1 million users.',
      difficulty: 'hard' as const,
      timeLimit: 120,
      category: 'System Design'
    },
    {
      id: 'fallback_hard_2',
      text: 'How would you implement caching for a high-traffic e-commerce website?',
      difficulty: 'hard' as const,
      timeLimit: 120,
      category: 'Performance'
    },
    {
      id: 'fallback_hard_3',
      text: 'Design a microservices architecture for an online banking system.',
      difficulty: 'hard' as const,
      timeLimit: 120,
      category: 'System Design'
    },
    {
      id: 'fallback_hard_4',
      text: 'How would you implement a distributed rate limiting system?',
      difficulty: 'hard' as const,
      timeLimit: 120,
      category: 'Architecture'
    }
  ];

  const easyQuestions = allQuestions.filter(q => q.difficulty === 'easy').sort(() => Math.random() - 0.5);
  const mediumQuestions = allQuestions.filter(q => q.difficulty === 'medium').sort(() => Math.random() - 0.5);
  const hardQuestions = allQuestions.filter(q => q.difficulty === 'hard').sort(() => Math.random() - 0.5);

  return [
    ...easyQuestions.slice(0, 2),
    ...mediumQuestions.slice(0, 2),
    ...hardQuestions.slice(0, 2)
  ];
}

function getFallbackQuestion(index: number): Question {
  const fallbacks = getFallbackQuestions();
  return fallbacks[index % fallbacks.length];
}