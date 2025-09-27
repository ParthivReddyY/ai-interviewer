'use client';

import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Clock, Send, MessageCircle, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { aiService } from '@/services/aiService';
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

  const currentQuestion = interview?.questions[interview.currentQuestionIndex];
  const isLastQuestion = interview ? interview.currentQuestionIndex === interview.questions.length - 1 : false;

  const completeInterviewProcess = React.useCallback(async () => {
    if (!interview) return;

    try {
      // Calculate final score
      const scores = interview.answers.map(a => a.score || 0);
      const finalScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      // Generate final summary with AI
      let summary = '';
      try {
        summary = await aiService.generateFinalSummary(interview.answers, finalScore);
      } catch (error) {
        console.error('Error generating summary:', error);
        summary = 'Interview completed successfully. Detailed feedback is not available at this time.';
      }

      // Complete the interview
      completeInterview(interview.id, finalScore, summary);

      // Add completion message
      addChatMessage({
        type: 'system',
        content: `🎉 Interview completed!\n\nFinal Score: ${finalScore.toFixed(1)}/10\n\n${summary}`,
      });

      // Switch to interviewer tab to show results
      setActiveTab('interviewer');
    } catch (error) {
      console.error('Error completing interview:', error);
      addChatMessage({
        type: 'system',
        content: 'There was an error completing the interview. Please try again.',
      });
    }
  }, [interview, completeInterview, addChatMessage, setActiveTab]);

  const submitAnswer = React.useCallback(async (answerText: string) => {
    if (isSubmitting || !currentQuestion || !interview) return;

    setIsSubmitting(true);
    setIsTimerRunning(false);

    try {
      const timeSpent = currentQuestion.timeLimit - timeLeft;
      
      // Add user message to chat
      addChatMessage({
        type: 'user',
        content: answerText,
      });

      // Create answer object
      const answer: Answer = {
        questionId: currentQuestion.id,
        text: answerText,
        timeSpent: timeSpent,
        score: 0,
        feedback: '',
      };

      // Evaluate answer with AI
      try {
        const evaluation = await aiService.evaluateAnswer(currentQuestion, answer);
        answer.score = evaluation.score;
        answer.feedback = evaluation.feedback;
      } catch (error) {
        console.error('Error evaluating answer:', error);
        // Fallback scoring
        answer.score = answerText.length > 10 ? 5 : 2;
        answer.feedback = 'Unable to provide detailed feedback at this time.';
      }

      // Add answer to interview
      addAnswer(interview.id, answer);

      // Add feedback message
      addChatMessage({
        type: 'system',
        content: `Answer submitted! Score: ${answer.score}/10\nTime used: ${timeSpent}/${currentQuestion.timeLimit} seconds`,
      });

      // Move to next question or complete interview
      if (isLastQuestion) {
        await completeInterviewProcess();
      } else {
        // Move to next question
        nextQuestion(interview.id);
        
        const nextQ = interview.questions[interview.currentQuestionIndex + 1];
        if (nextQ) {
          addChatMessage({
            type: 'ai',
            content: `Great! Let's continue with question ${interview.currentQuestionIndex + 2} of ${interview.questions.length}:\n\n${nextQ.text}\n\nYou have ${nextQ.timeLimit} seconds to answer.`,
          });
          setTimeLeft(nextQ.timeLimit);
          setIsTimerRunning(true);
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
  }, [isSubmitting, currentQuestion, interview, timeLeft, addChatMessage, addAnswer, isLastQuestion, completeInterviewProcess, nextQuestion]);

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

  // Start timer when component mounts or question changes
  React.useEffect(() => {
    if (currentQuestion && timeLeft === 0) {
      setTimeLeft(currentQuestion.timeLimit);
      setIsTimerRunning(true);
    }
  }, [currentQuestion, timeLeft]);

  // Timer countdown
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isTimerRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timeLeft, isTimerRunning, handleAutoSubmit]);

  if (!interview || !currentQuestion) {
    return (
      <div className="p-4">
        <p>Interview not found or no questions available.</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 30) return 'bg-red-500';
    if (timeLeft <= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressWidth = () => {
    const percentage = ((interview.currentQuestionIndex + 1) / interview.questions.length) * 100;
    if (percentage <= 16.67) return 'w-1/6';
    if (percentage <= 33.33) return 'w-1/3';
    if (percentage <= 50) return 'w-1/2';
    if (percentage <= 66.67) return 'w-2/3';
    if (percentage <= 83.33) return 'w-5/6';
    return 'w-full';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">
                Question {interview.currentQuestionIndex + 1} of {interview.questions.length}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                General Interview
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <Badge variant="secondary" className={`${getTimerColor()} text-white`}>
                {formatTime(timeLeft)}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Question */}
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

      {/* Chat Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
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

      {/* Answer Input */}
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
              disabled={isSubmitting || !currentAnswer.trim() || timeLeft === 0}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Submit Answer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{interview.currentQuestionIndex + 1} / {interview.questions.length}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={`bg-primary h-2 rounded-full transition-all duration-300 ${getProgressWidth()}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}