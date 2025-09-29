"use client";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Play, User } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { generateQuestionsAction } from "@/lib/actions";
import type { Candidate, Question } from "@/types";

interface InterviewStartProps {
  candidate: Candidate;
}

export default function InterviewStart({ candidate }: InterviewStartProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [error, setError] = useState<string>("");
  const { createInterview, addChatMessage, addQuestion, updateInterview } = useAppStore();

  const handleStartInterview = async () => {
    setIsStarting(true);
    setError("");

    try {
      const interview = createInterview(candidate.id);
      
      addChatMessage({
        type: 'system',
        content: `Welcome to your technical interview, ${candidate.name}! You'll be asked 6 questions of varying difficulty. Take your time to provide thoughtful answers.`,
      });

      setIsGeneratingQuestions(true);
      addChatMessage({
        type: 'system',
        content: '🚀 **Generating personalized interview questions...**\n\nOur optimized AI system is analyzing your profile and creating 6 tailored questions in a single efficient request. We use smart batching to reduce API calls while maintaining quality!\n\n✨ Just a moment while we prepare your custom interview...',
      });

      const resumeData = (candidate.skills || candidate.experience || candidate.education) && candidate.resumeContent ? {
        skills: candidate.skills,
        experience: candidate.experience,
        education: candidate.education,
        rawText: candidate.resumeContent
      } : undefined;
      
      const questions = await generateQuestionsAction(candidate.name, candidate.resumeContent, resumeData);
      setIsGeneratingQuestions(false);
      
      questions.forEach((question: Question) => {
        addQuestion(interview.id, question);
      });

      updateInterview(interview.id, { 
        status: 'in-progress',
        startedAt: new Date()
      });

      if (questions.length > 0) {
        addChatMessage({
          type: 'ai',
          content: `Let's begin with your first question:\n\n${questions[0].text}\n\nYou have ${questions[0].timeLimit} seconds to answer. Take your time and provide a detailed response.`,
        });
      }

    } catch (err) {
      console.error('Error starting interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to start interview');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-2xl">Hello, {candidate.name}!</CardTitle>
            <CardDescription className="text-base">
              Your information has been processed. Let&apos;s start your technical interview.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Your Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Name:</strong> {candidate.name}
            </div>
            <div>
              <strong>Email:</strong> {candidate.email}
            </div>
            <div>
              <strong>Phone:</strong> {candidate.phone}
            </div>
          </div>
          
          {(candidate.skills || candidate.experience || candidate.education) && (
            <div className="mt-4 space-y-3">
              {candidate.skills && candidate.skills.length > 0 && (
                <div>
                  <strong className="text-sm">Skills:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {candidate.skills.slice(0, 8).map((skill, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 8 && (
                      <span className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
                        +{candidate.skills.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {candidate.experience && (
                <div>
                  <strong className="text-sm">Experience:</strong>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {candidate.experience.length > 200 
                      ? `${candidate.experience.substring(0, 200)}...` 
                      : candidate.experience
                    }
                  </p>
                </div>
              )}
              
              {candidate.education && (
                <div>
                  <strong className="text-sm">Education:</strong>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {candidate.education.length > 150 
                      ? `${candidate.education.substring(0, 150)}...` 
                      : candidate.education
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Interview Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">6</div>
              <div className="text-sm text-muted-foreground">Questions</div>
              <div className="text-xs text-muted-foreground mt-1">Technical & Behavioral</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">20-120s</div>
              <div className="text-sm text-muted-foreground">Per Question</div>
              <div className="text-xs text-muted-foreground mt-1">Varies by Difficulty</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">AI</div>
              <div className="text-sm text-muted-foreground">Powered</div>
              <div className="text-xs text-muted-foreground mt-1">Instant Feedback</div>
            </div>
          </div>
        </div>

        <Alert>
          <Play className="h-4 w-4" />
          <AlertDescription>
            Ready to begin? You&apos;ll be presented with 6 technical questions one at a time. 
            Each question has a time limit. You can submit your answer early, or it will be automatically 
            submitted when time runs out. Answer to the best of your ability - there&apos;s no penalty for 
            trying!
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleStartInterview}
            disabled={isStarting}
            className="px-8"
            title="Start your AI-powered technical interview with personalized questions"
            aria-label="Begin the interview process"
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isGeneratingQuestions ? (
                  "Generating Questions..."
                ) : (
                  "Starting Interview..."
                )}
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Interview
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}