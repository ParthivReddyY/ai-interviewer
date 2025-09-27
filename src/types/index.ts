export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeContent?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // in seconds
}

export interface Answer {
  questionId: string;
  text: string;
  timeSpent: number; // in seconds
  score?: number;
  feedback?: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  questions: Question[];
  answers: Answer[];
  currentQuestionIndex: number;
  status: 'not-started' | 'in-progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  finalScore?: number;
  summary?: string;
}

export interface ChatMessage {
  id: string;
  type: 'system' | 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface AppState {
  candidates: Candidate[];
  interviews: Interview[];
  currentCandidate?: Candidate;
  currentInterview?: Interview;
  chatHistory: ChatMessage[];
  activeTab: 'interviewee' | 'interviewer';
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';