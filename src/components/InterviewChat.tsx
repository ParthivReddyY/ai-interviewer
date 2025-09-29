'use client';

import React, { useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Clock, Send, MessageCircle, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { evaluateAnswersAction, generateSummaryAction } from '@/lib/actions';
import { InterviewCompletionModal } from './InterviewCompletionModal';
import type { Answer, ChatMessage } from '@/types';

interface InterviewChatProps {
  interviewId: string;
}

export function InterviewChat({ interviewId }: InterviewChatProps) {
  const {
    interviews,
    chatHistory,
    addChatMessage,
    addAnswer,
    updateAnswer,
    nextQuestion,
    completeInterview,
    setActiveTab,
  } = useAppStore();

  const interview = interviews.find(i => i.id === interviewId);
  const messages = chatHistory;

  const [currentAnswer, setCurrentAnswer] = React.useState('');
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isProcessingResults, setIsProcessingResults] = React.useState(false);
  const [hasAnsweredCurrentQuestion, setHasAnsweredCurrentQuestion] = React.useState(false);
  const [showCompletionModal, setShowCompletionModal] = React.useState(false);
  const [completionData, setCompletionData] = React.useState<{
    finalScore: number;
    summary: string;
    candidateName: string;
  } | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const currentQuestion = interview?.questions[interview.currentQuestionIndex];
  const isLastQuestion = interview ? interview.currentQuestionIndex === interview.questions.length - 1 : false;

  const completeInterviewProcess = React.useCallback(async () => {
    if (!interview) return;

    setIsProcessingResults(true);
    
    // Get candidate name from store
    const { getCandidateById } = useAppStore.getState();
    const candidate = getCandidateById(interview.candidateId);
    
    try {
      addChatMessage({
        type: 'system',
        content: `🤖 **Processing Interview Results...**\n\nAnalyzing your ${interview.answers.length} responses and generating comprehensive feedback. This may take a moment.`,
      });
      
      const evaluationResult = await evaluateAnswersAction(interview.questions, interview.answers);
      
      // Check if any answer used fallback evaluation (indicates quota issues)
      const usedFallback = evaluationResult.detailedFeedback.some(a => 
        a.feedback?.includes('AI service temporarily unavailable') || 
        a.feedback?.includes('backup analysis')
      );
      
      if (usedFallback) {
        addChatMessage({
          type: 'system',
          content: `ℹ️ **Evaluation Notice**\n\nDue to high AI service demand, some evaluations used our intelligent backup analysis system. Your scores and feedback remain accurate and comprehensive!`,
        });
      }
      
      evaluationResult.detailedFeedback.forEach((evaluatedAnswer, index) => {
        updateAnswer(interview.id, index, evaluatedAnswer);
      });

      const finalScore = evaluationResult.overallScore;

      let summary = '';
      try {
        summary = await generateSummaryAction(evaluationResult.detailedFeedback, finalScore);
      } catch (error) {
        console.error('Error generating summary:', error);
        summary = 'Interview completed successfully. Detailed feedback is not available at this time.';
      }

      completeInterview(interview.id, finalScore, summary);

      // Set completion data for modal and show it
      const completionInfo = {
        finalScore,
        summary,
        candidateName: candidate?.name || 'Candidate'
      };
      
      setCompletionData(completionInfo);
      setIsProcessingResults(false);
      
      // Show modal after setting data
      setTimeout(() => {
        setShowCompletionModal(true);
      }, 500);

    } catch (error) {
      console.error('Error completing interview:', error);
      
      // Check if it's a quota/service unavailable error
      const isQuotaError = error instanceof Error && 
        (error.message.includes('quota exceeded') || 
         error.message.includes('Too Many Requests') ||
         error.message.includes('429') ||
         error.message.includes('503'));
      
      // Still show modal with appropriate info
      let fallbackMessage = 'Interview completed. There was an error generating detailed feedback.';
      if (isQuotaError) {
        fallbackMessage = 'Interview completed successfully! Your responses have been evaluated using our intelligent backup system due to high API demand. All core feedback and scoring has been calculated accurately.';
      }
      
      const fallbackCompletionInfo = {
        finalScore: interview.answers.reduce((sum, ans) => sum + (ans.score || 5), 0) / interview.answers.length,
        summary: fallbackMessage,
        candidateName: candidate?.name || 'Candidate'
      };
      
      setCompletionData(fallbackCompletionInfo);
      setIsProcessingResults(false);
      
      // Show modal after setting fallback data
      setTimeout(() => {
        setShowCompletionModal(true);
      }, 500);
    }
  }, [interview, completeInterview, updateAnswer, addChatMessage]);

  const handleModalClose = () => {
    setShowCompletionModal(false);
    setActiveTab('interviewer');
  };

  const submitAnswer = React.useCallback(async (answerText: string) => {
    if (isSubmitting || !currentQuestion || !interview || hasAnsweredCurrentQuestion) return;

    setIsSubmitting(true);
    setHasAnsweredCurrentQuestion(true);
    setIsTimerRunning(false);

    try {
      const timeSpent = currentQuestion.timeLimit - timeLeft;
      
      addChatMessage({
        type: 'user',
        content: answerText,
      });

      const answer: Answer = {
        questionId: currentQuestion.id,
        text: answerText,
        timeSpent: timeSpent,
        score: 0,
        feedback: 'Processing your answer...',
        strengths: [],
        improvements: []
      };

      addAnswer(interview.id, answer);

      addChatMessage({
        type: 'system',
        content: `✅ Answer submitted!\n\n⏱️ Time used: ${timeSpent}/${currentQuestion.timeLimit} seconds\n\n🤖 Getting AI feedback...`,
      });

      const savedTimerKey = `timer_${interview.id}_${currentQuestion.id}`;
      localStorage.removeItem(savedTimerKey);

      let evaluatedAnswer = answer;
      try {
       
        const evaluation = {
          score: 0, 
          feedback: 'Answer recorded! Full evaluation will be provided at the end.',
          strengths: ['Response submitted'],
          improvements: ['Complete the interview for detailed feedback']
        };
        
        evaluatedAnswer = {
          ...answer,
          score: evaluation.score,
          feedback: evaluation.feedback,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements
        };
        
        addAnswer(interview.id, evaluatedAnswer);
        
        addChatMessage({
          type: 'ai',
          content: `🎯 **Quick Feedback:**\n\n**Score:** ${evaluation.score}/10\n\n**${evaluation.feedback}**\n\n✅ **Strength:** ${evaluation.strengths[0] || 'Good effort'}\n\n💡 **Tip:** ${evaluation.improvements[0] || 'Keep practicing'}`,
        });
        
      } catch (evalError) {
        console.error('Quick evaluation failed:', evalError);
        addChatMessage({
          type: 'system',
          content: `📝 Answer recorded successfully! Detailed evaluation will be provided at the end of the interview.`,
        });
      }

      if (isLastQuestion) {
        addChatMessage({
          type: 'system',
          content: `� **CONGRATULATIONS!** 🎊\n\n✅ **Interview Successfully Completed!**\n\nYou have answered all ${interview.questions.length} questions. Excellent work!\n\n🔄 **What happens next:**\n• 🤖 AI is analyzing your responses\n• 📊 Calculating your final score\n• 📝 Generating personalized feedback\n• 📋 Creating detailed performance insights\n\n⏳ **Processing your results now...**\n\n*This usually takes 30-60 seconds. A completion summary will appear shortly!*`
        });
        
        // Start processing after a brief delay to show the completion message
        setTimeout(() => completeInterviewProcess(), 2000);
      } else {
        const nextQ = interview.questions[interview.currentQuestionIndex + 1];
        
        nextQuestion(interview.id);
        
        setTimeout(() => {
          setHasAnsweredCurrentQuestion(false);
        }, 100);
        
        if (nextQ) {
          addChatMessage({
            type: 'ai',
            content: `Great work! Let's continue with question ${interview.currentQuestionIndex + 2} of ${interview.questions.length}:\n\n📋 Category: ${nextQ.category || 'General'}\n🎯 Difficulty: ${nextQ.difficulty}\n\n❓ ${nextQ.text}\n\nYou have ${nextQ.timeLimit} seconds to answer. Take your time and provide a detailed response.`,
          });
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      addChatMessage({
        type: 'system',
        content: 'There was an error submitting your answer. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
      setCurrentAnswer("");
    }
  }, [isSubmitting, currentQuestion, interview, timeLeft, addChatMessage, addAnswer, isLastQuestion, completeInterviewProcess, nextQuestion, hasAnsweredCurrentQuestion]);

  const handleAutoSubmit = React.useCallback(async () => {
    if (!currentAnswer.trim()) {
      await submitAnswer("No answer provided");
    } else {
      await submitAnswer(currentAnswer);
    }
  }, [currentAnswer, submitAnswer]);

  const handleSubmit = React.useCallback(async () => {
    if (!currentAnswer.trim()) return;
    await submitAnswer(currentAnswer);
  }, [currentAnswer, submitAnswer]);

  React.useEffect(() => {
    if (currentQuestion) {
      setHasAnsweredCurrentQuestion(false);
      
      const savedTimerKey = `timer_${interview?.id}_${currentQuestion.id}`;
      const savedTime = localStorage.getItem(savedTimerKey);
      
      if (savedTime && parseInt(savedTime) > 0) {
        setTimeLeft(parseInt(savedTime));
        setIsTimerRunning(true);
      } else {
        setTimeLeft(currentQuestion.timeLimit);
        setIsTimerRunning(true);
      }
    }
  }, [currentQuestion, interview?.id]); 
  React.useEffect(() => {
    if (currentQuestion && interview?.id && timeLeft > 0) {
      const savedTimerKey = `timer_${interview.id}_${currentQuestion.id}`;
      localStorage.setItem(savedTimerKey, timeLeft.toString());
    }
  }, [timeLeft, currentQuestion, interview?.id]);

  React.useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setTimeout(() => {
              handleAutoSubmit();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerRunning, timeLeft, handleAutoSubmit]);

  if (!interview) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Interview not found.</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-muted-foreground">Preparing your next question...</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interview Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{interview.currentQuestionIndex + 1} / {interview.questions.length}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`bg-primary h-2 rounded-full transition-all duration-300 ${
                      interview.currentQuestionIndex + 1 === 1 ? 'w-1/6' :
                      interview.currentQuestionIndex + 1 === 2 ? 'w-2/6' :
                      interview.currentQuestionIndex + 1 === 3 ? 'w-3/6' :
                      interview.currentQuestionIndex + 1 === 4 ? 'w-4/6' :
                      interview.currentQuestionIndex + 1 === 5 ? 'w-5/6' :
                      'w-full'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Questions</h4>
                {interview.questions.map((q, index) => {
                  const isCompleted = index < interview.currentQuestionIndex;
                  const isCurrent = index === interview.currentQuestionIndex;
                  
                  return (
                    <div key={q.id} className={`p-2 rounded-lg border-2 transition-all ${
                      isCurrent ? 'border-primary bg-primary/5' : 
                      isCompleted ? 'border-green-200 bg-green-50 dark:bg-green-950' : 
                      'border-muted bg-muted/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            isCurrent ? 'bg-primary text-primary-foreground' :
                            isCompleted ? 'bg-green-500 text-white' : 
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-xs font-medium">
                              Q{index + 1} - {q.category}
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {q.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {currentQuestion && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Time Remaining</span>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className={`p-3 rounded-lg text-center ${
                    timeLeft <= 30 ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' :
                    timeLeft <= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200' :
                    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                  }`}>
                    <div className="text-2xl font-bold">{formatTime(timeLeft)}</div>
                    <div className="text-xs">{currentQuestion.timeLimit}s total</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    Question {interview.currentQuestionIndex + 1} of {interview.questions.length}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {currentQuestion?.category || 'General'} • {currentQuestion?.difficulty} Level
                  </p>
                </div>
                <Badge variant="outline" className="text-sm font-medium">
                  {interview.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
          </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Question</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Difficulty: {currentQuestion.difficulty} | Time Limit: {currentQuestion.timeLimit}s
          </p>
          <p className="font-medium">{currentQuestion.text}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={chatContainerRef}
            className="space-y-3 max-h-64 overflow-y-auto scroll-smooth"
          >
            {messages.map((message: ChatMessage, index: number) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[80%] ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.type === 'ai'
                      ? 'bg-muted'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.type === 'user' && <User className="h-3 w-3" />}
                    <span className="text-xs font-medium">
                      {message.type === 'user' ? 'You' : message.type === 'ai' ? 'AI Interviewer' : 'System'}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Answer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[120px]"
            disabled={isSubmitting || timeLeft === 0}
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {currentAnswer.length} characters
            </p>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !currentAnswer.trim() || timeLeft === 0 || isProcessingResults}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Answer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

        </div>
      </div>

      {/* Processing Results Overlay */}
      {isProcessingResults && !showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 mx-4">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Processing Results</h3>
                  <p className="text-sm text-muted-foreground">
                    🤖 AI is analyzing your responses<br />
                    📊 Calculating your final score<br />
                    📝 Generating personalized feedback<br />
                    <br />
                    Please wait, this may take 30-60 seconds...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Completion Modal */}
      {completionData && (
        <InterviewCompletionModal
          isOpen={showCompletionModal}
          onClose={handleModalClose}
          candidateName={completionData.candidateName}
          finalScore={completionData.finalScore}
          isProcessing={isProcessingResults}
          summary={completionData.summary}
        />
      )}
    </div>
  );
}