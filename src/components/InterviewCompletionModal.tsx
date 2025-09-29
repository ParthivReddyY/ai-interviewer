'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Sparkles, TrendingUp, FileText, Award } from 'lucide-react';

interface InterviewCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  finalScore: number;
  isProcessing: boolean;
  summary?: string;
}

export function InterviewCompletionModal({
  isOpen,
  onClose,
  candidateName,
  finalScore,
  isProcessing,
  summary
}: InterviewCompletionModalProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  const steps = [
    { label: 'Analyzing Responses', icon: FileText, description: 'Evaluating technical accuracy and approach' },
    { label: 'Calculating Scores', icon: TrendingUp, description: 'Computing performance metrics' },
    { label: 'Generating Summary', icon: Sparkles, description: 'Creating detailed feedback report' },
    { label: 'Complete!', icon: Award, description: 'Interview analysis finished' }
  ];

  React.useEffect(() => {
    if (!isProcessing || !isOpen) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        
        // Update step based on progress
        if (newProgress >= 25 && currentStep === 0) {
          setCurrentStep(1);
        } else if (newProgress >= 50 && currentStep === 1) {
          setCurrentStep(2);
        } else if (newProgress >= 75 && currentStep === 2) {
          setCurrentStep(3);
        }

        return Math.min(newProgress, 95); // Don't complete until actual processing is done
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isProcessing, isOpen, currentStep]);

  React.useEffect(() => {
    if (!isProcessing && isOpen) {
      // Processing completed
      setProgress(100);
      setCurrentStep(3);
    }
  }, [isProcessing, isOpen]);

  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800';
    if (score >= 6) return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800';
    if (score >= 4) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800';
    return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 8) return 'Excellent Performance! 🌟';
    if (score >= 6) return 'Good Performance! 👍';
    if (score >= 4) return 'Fair Performance 📈';
    return 'Needs Improvement 💪';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl mx-auto shadow-xl border max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          {isProcessing ? (
            // Processing view
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary-foreground animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Processing Results
                </h2>
                <p className="text-muted-foreground text-base max-w-2xl mx-auto">
                  🤖 AI is analyzing your responses<br />
                  📊 Calculating your final score<br />
                  📝 Generating personalized feedback
                </p>
              </div>

              <div className="space-y-6">
                <div className="max-w-md mx-auto">
                  <Progress value={progress} className="h-2" />
                  <div className="text-center mt-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {progress.toFixed(0)}% Complete
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-4 rounded-lg border transition-all duration-300 ${
                          isActive
                            ? 'bg-primary/5 border-primary'
                            : isCompleted
                            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                            : 'bg-muted border-border'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isActive
                              ? 'bg-primary text-primary-foreground animate-pulse'
                              : 'bg-muted-foreground/20 text-muted-foreground'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-medium text-sm ${
                            isActive ? 'text-primary' : isCompleted ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground'
                          }`}>
                            {step.label}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                      Please wait, this may take 30-60 seconds...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Completion view
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Award className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Interview Complete!
                </h2>
                <p className="text-muted-foreground">
                  Great job, <span className="font-semibold text-primary">{candidateName}</span>! Here are your results:
                </p>
              </div>

              <div className="space-y-6">
                {/* Score Section */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Final Score</h3>
                      <div className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold border ${getScoreColor(finalScore)}`}>
                        {finalScore.toFixed(1)}/10
                      </div>
                      <p className="text-base font-medium text-muted-foreground">
                        {getScoreMessage(finalScore)}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <FileText className="w-5 h-5 mx-auto text-primary mb-2" />
                        <p className="text-xs font-medium text-foreground">Analysis</p>
                        <p className="text-xs text-muted-foreground">Complete</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <TrendingUp className="w-5 h-5 mx-auto text-green-600 mb-2" />
                        <p className="text-xs font-medium text-foreground">Scoring</p>
                        <p className="text-xs text-muted-foreground">Finalized</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Sparkles className="w-5 h-5 mx-auto text-purple-600 mb-2" />
                        <p className="text-xs font-medium text-foreground">Feedback</p>
                        <p className="text-xs text-muted-foreground">Generated</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Section */}
                {summary && (
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Summary & Detailed Feedback</h4>
                      <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto border-t pt-4">
                        {summary}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Your detailed results have been saved. You can view them from the interviewer dashboard.
                </p>
                <Button 
                  onClick={onClose}
                  className="w-full"
                >
                  View Results & Continue
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}