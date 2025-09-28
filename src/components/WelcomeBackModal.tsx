"use client";
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Calendar, PlayCircle, Trash2, Timer, Target, TrendingUp } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Interview, Candidate } from '@/types';

interface WelcomeBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview;
  candidate: Candidate;
}

export function WelcomeBackModal({ isOpen, onClose, interview, candidate }: WelcomeBackModalProps) {
  const { setCurrentCandidate, setCurrentInterview, addChatMessage, clearCurrentSession } = useAppStore();
  const [isAnimating, setIsAnimating] = React.useState(false);

  const handleContinue = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentCandidate(candidate);
      setCurrentInterview(interview);
      
      addChatMessage({
        type: 'system',
        content: `🎉 Welcome back, ${candidate.name}! Your interview session has been restored.\n\nYou were on question ${interview.currentQuestionIndex + 1} of ${interview.questions.length}. Let's continue where you left off.`
      });
      
      onClose();
      setIsAnimating(false);
    }, 500);
  };

  const handleStartNew = () => {
    setIsAnimating(true);
    setTimeout(() => {
      clearCurrentSession();
      onClose();
      setIsAnimating(false);
    }, 300);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const questionsAnswered = interview.answers.length;
  const totalQuestions = interview.questions.length;
  const progress = Math.round((questionsAnswered / totalQuestions) * 100);
  const nextQuestionIndex = interview.currentQuestionIndex + 1;
  
  const timeSpent = interview.answers.reduce((acc, ans) => acc + ans.timeSpent, 0);
  const avgTimePerQuestion = questionsAnswered > 0 ? Math.round(timeSpent / questionsAnswered) : 0;
  const getProgressStatus = () => {
    if (progress >= 80) return { color: 'text-green-500', bg: 'bg-green-100', label: 'Almost Done!' };
    if (progress >= 50) return { color: 'text-blue-500', bg: 'bg-blue-100', label: 'Good Progress' };
    if (progress >= 25) return { color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'Getting Started' };
    return { color: 'text-gray-500', bg: 'bg-gray-100', label: 'Just Started' };
  };

  const progressStatus = getProgressStatus();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-white/20 rounded-full">
                <PlayCircle className="h-6 w-6" />
              </div>
              Welcome Back, {candidate.name}!
            </DialogTitle>
            <DialogDescription className="text-blue-100">
              You have an unfinished interview session. Ready to continue your journey?
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Interview Progress</span>
                </div>
                <Badge className={`${progressStatus.bg} ${progressStatus.color} border-0`}>
                  {progressStatus.label}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Questions Completed</span>
                  <span className="font-semibold">{questionsAnswered} of {totalQuestions}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  Next: Question {nextQuestionIndex}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Session Started</p>
                  <p className="text-sm font-medium">{formatDate(interview.startedAt || new Date())}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Timer className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Response Time</p>
                  <p className="text-sm font-medium">{avgTimePerQuestion}s per question</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{candidate.name}</p>
                  <p className="text-sm text-muted-foreground">{candidate.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="outline" className="text-xs">
                    In Progress
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {questionsAnswered > 0 && (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-900">Performance Preview</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">{progress}%</div>
                    <div className="text-xs text-muted-foreground">Complete</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{questionsAnswered}</div>
                    <div className="text-xs text-muted-foreground">Answered</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">{totalQuestions - questionsAnswered}</div>
                    <div className="text-xs text-muted-foreground">Remaining</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="p-6 pt-0 gap-3">
          <Button 
            variant="outline" 
            onClick={handleStartNew}
            disabled={isAnimating}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Start Fresh
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={isAnimating}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <PlayCircle className="h-4 w-4" />
            {isAnimating ? 'Loading...' : 'Continue Interview'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}