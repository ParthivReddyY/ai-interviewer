"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Target, BarChart3, Users } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import IntervieweeTab from "@/components/IntervieweeTab";
import InterviewerTab from "@/components/InterviewerTab";
import { WelcomeBackModal } from "@/components/WelcomeBackModal";
import type { Interview, Candidate } from "@/types";

export default function Home() {
  const { activeTab, setActiveTab, interviews, getCandidateById, currentCandidate, currentInterview } = useAppStore();
  const [showWelcomeBack, setShowWelcomeBack] = React.useState(false);
  const [unfinishedInterview, setUnfinishedInterview] = React.useState<{ interview: Interview; candidate: Candidate } | null>(null);
  const [hasShownWelcomeBack, setHasShownWelcomeBack] = React.useState(false);
  const [sessionActive, setSessionActive] = React.useState(false);

  React.useEffect(() => {
    const markSessionActive = () => setSessionActive(true);
    
    window.addEventListener('click', markSessionActive);
    window.addEventListener('keypress', markSessionActive);
    window.addEventListener('scroll', markSessionActive);
    
    return () => {
      window.removeEventListener('click', markSessionActive);
      window.removeEventListener('keypress', markSessionActive);
      window.removeEventListener('scroll', markSessionActive);
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    
    const timer = setTimeout(() => {
      if (!isMounted || hasShownWelcomeBack || sessionActive) return;
      
      const checkForUnfinishedInterview = () => {
        if (currentInterview && currentCandidate) {
          if (currentInterview.status === 'in-progress') {
            setUnfinishedInterview({ interview: currentInterview, candidate: currentCandidate });
            setShowWelcomeBack(true);
            setHasShownWelcomeBack(true);
            return;
          }
        }

        const inProgressInterview = interviews.find(i => i.status === 'in-progress');
        
        if (inProgressInterview) {
          const candidate = getCandidateById(inProgressInterview.candidateId);
          if (candidate) {
            setUnfinishedInterview({ interview: inProgressInterview, candidate });
            setShowWelcomeBack(true);
            setHasShownWelcomeBack(true);
          }
        }
      };

      checkForUnfinishedInterview();
    }, 500); 

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [hasShownWelcomeBack, sessionActive, currentInterview, currentCandidate, interviews, getCandidateById]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-200/30">
      <div className="container mx-auto py-8">
        <div className="text-center space-y-8 mb-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-300/50">
              <Sparkles className="h-4 w-4 text-slate-700" />
              <span className="text-sm font-medium text-slate-800">Powered by Advanced AI</span>
            </div>
            
            <h1 className="text-6xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                AI Interview Assistant
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Transform your hiring process with intelligent AI-driven assessments, real-time evaluation, 
              and comprehensive candidate insights
            </p>
          </div>

          <div className="flex justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-sm">
              <Target className="h-4 w-4 text-slate-700" />
              <span className="text-sm font-medium text-slate-700">Smart Questions</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-sm">
              <BarChart3 className="h-4 w-4 text-slate-700" />
              <span className="text-sm font-medium text-slate-700">Real-time Scoring</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-sm">
              <Users className="h-4 w-4 text-slate-700" />
              <span className="text-sm font-medium text-slate-700">Candidate Management</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'interviewee' | 'interviewer')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-14 p-1 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg rounded-2xl">
              <TabsTrigger 
                value="interviewee" 
                className="data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg h-12 rounded-xl font-semibold text-base transition-all duration-300 flex items-center gap-2 hover:bg-slate-100"
                title="Start taking your AI-powered technical interview"
                aria-label="Switch to interview taking mode"
              >
                <Target className="h-5 w-5" />
                Take Interview
              </TabsTrigger>
              <TabsTrigger 
                value="interviewer" 
                className="data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg h-12 rounded-xl font-semibold text-base transition-all duration-300 flex items-center gap-2 hover:bg-slate-100"
                title="Review and manage candidate interview results"
                aria-label="Switch to candidate review dashboard"
              >
                <BarChart3 className="h-5 w-5" />
                Review Candidates
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="interviewee" className="space-y-4 animate-in fade-in-50 duration-300">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  <IntervieweeTab />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="interviewer" className="space-y-4 animate-in fade-in-50 duration-300">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  <InterviewerTab />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {unfinishedInterview && (
        <WelcomeBackModal
          isOpen={showWelcomeBack}
          onClose={() => {
            setShowWelcomeBack(false);
            setHasShownWelcomeBack(true); 
          }}
          interview={unfinishedInterview.interview}
          candidate={unfinishedInterview.candidate}
        />
      )}
    </div>
  );
}
