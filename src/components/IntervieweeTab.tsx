"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import ResumeUpload from "./ResumeUpload";
import InterviewStart from "./InterviewStart";
import { InterviewChat } from "./InterviewChat";

export default function IntervieweeTab() {
  const { currentCandidate, currentInterview } = useAppStore();

  // If no candidate, show resume upload
  if (!currentCandidate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Interview</CardTitle>
          <CardDescription>
            Please upload your resume to get started. We&apos;ll extract your basic information and begin the interview process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeUpload />
        </CardContent>
      </Card>
    );
  }

  // If candidate exists but no interview, show data collection or interview start
  if (!currentInterview) {
    return <InterviewStart candidate={currentCandidate} />;
  }

  // If both candidate and interview exist, show the interview interface
  return <InterviewChat interviewId={currentInterview.id} />;
}