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
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="bg-gradient-to-r from-slate-50 via-slate-100/50 to-slate-200/30 border-b border-slate-200/50 p-6 text-slate-900">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-3 text-2xl font-extrabold tracking-tight">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg">
                <PlayCircle className="h-6 w-6 text-white" />
              </div>
              Welcome Back, {candidate.name}!
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-lg">
              You have an unfinished interview session. Ready to continue your journey?
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-200/30">
          <Card className="border-l-4 border-l-blue-500 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-semibold text-slate-900 text-lg">Interview Progress</span>
                </div>
                <Badge className={`${progressStatus.bg} ${progressStatus.color} border-0 font-medium px-3 py-1`}>
                  {progressStatus.label}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-600">Questions Completed</span>
                  <span className="text-slate-900">{questionsAnswered} of {totalQuestions}</span>
                </div>
                <Progress value={progress} className="h-3 bg-slate-200" />
                <div className="text-sm text-slate-500 text-center font-medium">
                  Next: Question {nextQuestionIndex}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-slate-200/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Session Started</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{formatDate(interview.startedAt || new Date())}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-slate-200/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Timer className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Avg. Response Time</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{avgTimePerQuestion}s per question</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-full shadow-sm">
                  <User className="h-6 w-6 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-lg">{candidate.name}</p>
                  <p className="text-sm text-slate-600 mt-1">{candidate.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Status</p>
                  <Badge variant="outline" className="text-xs mt-1 border-blue-200 text-blue-700 bg-blue-50">
                    In Progress
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {questionsAnswered > 0 && (
            <Card className="border-2 border-dashed border-slate-300 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="font-semibold text-slate-900 text-lg">Performance Preview</span>
                </div>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{progress}%</div>
                    <div className="text-xs text-blue-700 uppercase tracking-wide font-medium">Complete</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">{questionsAnswered}</div>
                    <div className="text-xs text-green-700 uppercase tracking-wide font-medium">Answered</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{totalQuestions - questionsAnswered}</div>
                    <div className="text-xs text-orange-700 uppercase tracking-wide font-medium">Remaining</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="bg-white/90 backdrop-blur-sm border-t border-slate-200/50 p-6 gap-4">
          <Button 
            variant="outline" 
            onClick={handleStartNew}
            disabled={isAnimating}
            className="flex items-center gap-2 border-slate-300 hover:bg-slate-50 px-6 py-2"
          >
            <Trash2 className="h-4 w-4" />
            Start Fresh
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={isAnimating}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg px-6 py-2"
          >
            <PlayCircle className="h-4 w-4" />
            {isAnimating ? 'Loading...' : 'Continue Interview'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}