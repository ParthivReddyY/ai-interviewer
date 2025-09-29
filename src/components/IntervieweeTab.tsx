"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import ResumeUpload from "./ResumeUpload";
import InterviewStart from "./InterviewStart";
import { InterviewChat } from "./InterviewChat";

export default function IntervieweeTab() {
  const { currentCandidate, currentInterview } = useAppStore();

  if (!currentCandidate) {
    return (
      <Card role="main" aria-labelledby="interview-welcome-title">
        <CardHeader>
          <CardTitle id="interview-welcome-title">Welcome to Your AI-Powered Technical Interview</CardTitle>
          <CardDescription>
            Begin your intelligent interview experience by uploading your resume. Our AI will analyze your skills and create personalized questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeUpload />
        </CardContent>
      </Card>
    );
  }

  if (!currentInterview) {
    return <InterviewStart candidate={currentCandidate} />;
  }

  return <InterviewChat interviewId={currentInterview.id} />;
}