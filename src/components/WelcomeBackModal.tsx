"use client";
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, User, Calendar, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Interview, Candidate } from '@/types';

interface WelcomeBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview;
  candidate: Candidate;
}

export function WelcomeBackModal({ isOpen, onClose, interview, candidate }: WelcomeBackModalProps) {
  const { setCurrentCandidate, setCurrentInterview, addChatMessage } = useAppStore();

  const handleContinue = () => {
    setCurrentCandidate(candidate);
    setCurrentInterview(interview);
    
    // Add welcome back message
    addChatMessage({
      type: 'system',
      content: `🎉 Welcome back, ${candidate.name}! Your interview session has been restored.\n\nYou were on question ${interview.currentQuestionIndex + 1} of ${interview.questions.length}. Let's continue where you left off.`
    });
    
    onClose();
  };

  const handleStartNew = () => {
    // Reset the current session
    setCurrentCandidate(undefined);
    setCurrentInterview(undefined);
    onClose();
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const questionsAnswered = interview.answers.length;
  const totalQuestions = interview.questions.length;
  const progress = Math.round((questionsAnswered / totalQuestions) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Welcome Back!
          </DialogTitle>
          <DialogDescription>
            We found an unfinished interview session. Would you like to continue where you left off?
          </DialogDescription>
        </DialogHeader>

        <Card className="border-dashed">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{candidate.name}</p>
                <p className="text-sm text-muted-foreground">{candidate.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm">Started on</p>
                <p className="text-xs text-muted-foreground">{formatDate(interview.startedAt || new Date())}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm">Progress</p>
                <p className="text-xs text-muted-foreground">
                  {questionsAnswered} of {totalQuestions} questions answered ({progress}%)
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleStartNew}>
            Start New Interview
          </Button>
          <Button onClick={handleContinue}>
            Continue Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}