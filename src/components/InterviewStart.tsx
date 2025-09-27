"use client";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Play, User } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { aiService } from "@/services/aiService";
import type { Candidate } from "@/types";

interface InterviewStartProps {
  candidate: Candidate;
}

export default function InterviewStart({ candidate }: InterviewStartProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string>("");
  const { createInterview, addChatMessage, addQuestion, updateInterview } = useAppStore();

  const handleStartInterview = async () => {
    setIsStarting(true);
    setError("");

    try {
      // Create interview
      const interview = createInterview(candidate.id);
      
      // Add welcome message
      addChatMessage({
        type: 'system',
        content: `Welcome to your technical interview, ${candidate.name}! You'll be asked 6 questions of varying difficulty. Take your time to provide thoughtful answers.`,
      });

      // Generate questions using AI
      const questions = await aiService.generateQuestions(candidate.name);
      
      // Add questions to the interview
      questions.forEach(question => {
        addQuestion(interview.id, question);
      });

      // Update interview status to in-progress
      updateInterview(interview.id, { 
        status: 'in-progress',
        startedAt: new Date()
      });

      // Add first question message
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
        {/* Candidate Info */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Your Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Name:</span>
              <p>{candidate.name}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Email:</span>
              <p>{candidate.email}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Phone:</span>
              <p>{candidate.phone}</p>
            </div>
          </div>
        </div>

        {/* Interview Instructions */}
        <div className="space-y-4">
          <h3 className="font-semibold">Interview Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                </div>
                <p className="font-medium">Easy Questions</p>
                <p className="text-sm text-muted-foreground">20 seconds each</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="bg-yellow-100 dark:bg-yellow-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold">2</span>
                </div>
                <p className="font-medium">Medium Questions</p>
                <p className="text-sm text-muted-foreground">60 seconds each</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="bg-red-100 dark:bg-red-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-red-600 dark:text-red-400 font-bold">2</span>
                </div>
                <p className="font-medium">Hard Questions</p>
                <p className="text-sm text-muted-foreground">120 seconds each</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Alert>
          <Play className="h-4 w-4" />
          <AlertDescription>
            <strong>Instructions:</strong> You&apos;ll be presented with 6 technical questions one at a time. 
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

        {/* Start Button */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleStartInterview}
            disabled={isStarting}
            className="px-8"
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Interview...
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