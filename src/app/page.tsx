"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/useAppStore";
import IntervieweeTab from "@/components/IntervieweeTab";
import InterviewerTab from "@/components/InterviewerTab";

export default function Home() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold tracking-tight">AI-Powered Interview Assistant</h1>
          <p className="text-xl text-muted-foreground">
            Crisp - Streamline your technical interview process
          </p>
        </div>

        {/* Main Content - Two Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'interviewee' | 'interviewer')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="interviewee">Interviewee</TabsTrigger>
            <TabsTrigger value="interviewer">Interviewer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="interviewee" className="mt-6">
            <IntervieweeTab />
          </TabsContent>
          
          <TabsContent value="interviewer" className="mt-6">
            <InterviewerTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
