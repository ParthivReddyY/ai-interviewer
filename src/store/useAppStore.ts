import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, Candidate, Interview, ChatMessage, Question, Answer } from '@/types';

interface AppStore extends AppState {
  // Actions
  setActiveTab: (tab: 'interviewee' | 'interviewer') => void;
  
  // Candidate actions
  createCandidate: (data: { name: string; email: string; phone: string; resumeContent?: string; skills?: string[]; experience?: string; education?: string; }) => Candidate;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  setCurrentCandidate: (candidate: Candidate | undefined) => void;
  
  // Interview actions
  createInterview: (candidateId: string) => Interview;
  updateInterview: (id: string, updates: Partial<Interview>) => void;
  setCurrentInterview: (interview: Interview | undefined) => void;
  addQuestion: (interviewId: string, question: Question) => void;
  addAnswer: (interviewId: string, answer: Answer) => void;
  nextQuestion: (interviewId: string) => void;
  completeInterview: (interviewId: string, finalScore: number, summary: string) => void;
  
  // Chat actions
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;
  
  // Utility actions
  reset: () => void;
  getCandidateById: (id: string) => Candidate | undefined;
  getInterviewByCandidate: (candidateId: string) => Interview | undefined;
}

const initialState: AppState = {
  candidates: [],
  interviews: [],
  currentCandidate: undefined,
  currentInterview: undefined,
  chatHistory: [],
  activeTab: 'interviewee',
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setActiveTab: (tab) =>
        set((state) => ({ ...state, activeTab: tab })),

      createCandidate: (data) => {
        const candidate: Candidate = {
          id: uuidv4(),
          ...data,
          createdAt: new Date(),
        };

        set((state) => ({
          ...state,
          candidates: [...state.candidates, candidate],
          currentCandidate: candidate,
        }));

        return candidate;
      },

      updateCandidate: (id, updates) =>
        set((state) => ({
          ...state,
          candidates: state.candidates.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
          currentCandidate:
            state.currentCandidate?.id === id
              ? { ...state.currentCandidate, ...updates }
              : state.currentCandidate,
        })),

      setCurrentCandidate: (candidate) =>
        set((state) => ({ ...state, currentCandidate: candidate })),

      createInterview: (candidateId) => {
        const interview: Interview = {
          id: uuidv4(),
          candidateId,
          questions: [],
          answers: [],
          currentQuestionIndex: 0,
          status: 'not-started',
          startedAt: new Date(),
        };

        set((state) => ({
          ...state,
          interviews: [...state.interviews, interview],
          currentInterview: interview,
        }));

        return interview;
      },

      updateInterview: (id, updates) =>
        set((state) => ({
          ...state,
          interviews: state.interviews.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
          currentInterview:
            state.currentInterview?.id === id
              ? { ...state.currentInterview, ...updates }
              : state.currentInterview,
        })),

      setCurrentInterview: (interview) =>
        set((state) => ({ ...state, currentInterview: interview })),

      addQuestion: (interviewId, question) =>
        set((state) => ({
          ...state,
          interviews: state.interviews.map((i) =>
            i.id === interviewId
              ? { ...i, questions: [...i.questions, question] }
              : i
          ),
          currentInterview:
            state.currentInterview?.id === interviewId
              ? {
                  ...state.currentInterview,
                  questions: [...state.currentInterview.questions, question],
                }
              : state.currentInterview,
        })),

      addAnswer: (interviewId, answer) =>
        set((state) => ({
          ...state,
          interviews: state.interviews.map((i) =>
            i.id === interviewId
              ? { ...i, answers: [...i.answers, answer] }
              : i
          ),
          currentInterview:
            state.currentInterview?.id === interviewId
              ? {
                  ...state.currentInterview,
                  answers: [...state.currentInterview.answers, answer],
                }
              : state.currentInterview,
        })),

      nextQuestion: (interviewId) =>
        set((state) => ({
          ...state,
          interviews: state.interviews.map((i) =>
            i.id === interviewId
              ? { ...i, currentQuestionIndex: i.currentQuestionIndex + 1 }
              : i
          ),
          currentInterview:
            state.currentInterview?.id === interviewId
              ? {
                  ...state.currentInterview,
                  currentQuestionIndex: state.currentInterview.currentQuestionIndex + 1,
                }
              : state.currentInterview,
        })),

      completeInterview: (interviewId, finalScore, summary) =>
        set((state) => ({
          ...state,
          interviews: state.interviews.map((i) =>
            i.id === interviewId
              ? {
                  ...i,
                  status: 'completed' as const,
                  completedAt: new Date(),
                  finalScore,
                  summary,
                }
              : i
          ),
          currentInterview:
            state.currentInterview?.id === interviewId
              ? {
                  ...state.currentInterview,
                  status: 'completed' as const,
                  completedAt: new Date(),
                  finalScore,
                  summary,
                }
              : state.currentInterview,
        })),

      addChatMessage: (message) => {
        const chatMessage: ChatMessage = {
          id: uuidv4(),
          timestamp: new Date(),
          ...message,
        };

        set((state) => ({
          ...state,
          chatHistory: [...state.chatHistory, chatMessage],
        }));
      },

      clearChatHistory: () =>
        set((state) => ({ ...state, chatHistory: [] })),

      getCandidateById: (id) => get().candidates.find((c) => c.id === id),

      getInterviewByCandidate: (candidateId) =>
        get().interviews.find((i) => i.candidateId === candidateId),

      reset: () => set(initialState),
    }),
    {
      name: 'ai-interviewer-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        candidates: state.candidates,
        interviews: state.interviews,
        currentCandidate: state.currentCandidate,
        currentInterview: state.currentInterview,
        chatHistory: state.chatHistory,
        activeTab: state.activeTab,
      }),
    }
  )
);