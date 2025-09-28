"use client";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Users, Trophy, Clock, Search, FileText, 
         CheckCircle, XCircle, AlertCircle, Award, Target, TrendingUp, ChevronLeft, ChevronRight,
         UserCheck, UserX, Eye, Trash2, BarChart3, X, Filter, ArrowUpDown, Calendar, User, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

import { useAppStore } from "@/store/useAppStore";
import type { Candidate } from "@/types";

const CANDIDATES_PER_PAGE = 6;

export default function InterviewerTab() {
  const { candidates, interviews, updateCandidateStatus, clearAllData } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "date" | "name" | "status">("score");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const completedInterviews = interviews
    .filter((interview) => interview.status === "completed")
    .map((interview) => ({
      ...interview,
      candidate: candidates.find((c) => c.id === interview.candidateId),
    }))
    .filter((item) => item.candidate);

  const filteredCandidates = completedInterviews
    .filter((item) => {
      const candidate = item.candidate!;
      const matchesSearch = !searchTerm || 
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || 
        (candidate.status || 'pending') === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (b.finalScore || 0) - (a.finalScore || 0);
        case "date":
          return new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime();
        case "name":
          return a.candidate!.name.localeCompare(b.candidate!.name);
        case "status":
          return (a.candidate!.status || 'pending').localeCompare(b.candidate!.status || 'pending');
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredCandidates.length / CANDIDATES_PER_PAGE);
  const startIndex = (currentPage - 1) * CANDIDATES_PER_PAGE;
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + CANDIDATES_PER_PAGE);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'selected':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><UserCheck className="h-3 w-3 mr-1" />Selected</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><UserX className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'under-review':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Eye className="h-3 w-3 mr-1" />Under Review</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const handleStatusUpdate = (candidateId: string, status: 'selected' | 'rejected' | 'under-review' | 'pending') => {
    updateCandidateStatus(candidateId, status);
  };

  const handleClearAllData = () => {
    clearAllData();
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  if (selectedCandidate) {
    const interview = interviews.find((i) => i.candidateId === selectedCandidate.id);
    const finalScore = interview?.finalScore || 0;
    const totalQuestions = interview?.questions.length || 0;
    const answeredQuestions = interview?.answers.length || 0;
    const totalTimeSpent = interview?.answers.reduce((acc, ans) => acc + ans.timeSpent, 0) || 0;
    const totalTimeLimit = interview?.questions.reduce((acc, q) => acc + q.timeLimit, 0) || 0;
    
    const completionRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    const averageScore = (interview?.answers?.length || 0) > 0 
      ? interview!.answers.reduce((acc, ans) => acc + (ans.score || 0), 0) / interview!.answers.length 
      : 0;

    const getPerformanceLevel = (score: number) => {
      if (score >= 8.5) return { level: "Outstanding", color: "bg-emerald-500", icon: Trophy };
      if (score >= 7.5) return { level: "Excellent", color: "bg-blue-500", icon: Award };
      if (score >= 6.5) return { level: "Good", color: "bg-green-500", icon: CheckCircle };
      if (score >= 5.0) return { level: "Average", color: "bg-yellow-500", icon: AlertCircle };
      return { level: "Needs Improvement", color: "bg-red-500", icon: XCircle };
    };

    const performance = getPerformanceLevel(finalScore);
    const PerformanceIcon = performance.icon;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-start">
          <Button variant="outline" onClick={() => setSelectedCandidate(null)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-white to-blue-50/30">
          <CardHeader className="pb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center space-x-6 flex-1">
                <Avatar className="h-20 w-20 ring-4 ring-blue-100">
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700">
                    {getInitials(selectedCandidate.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold text-slate-900 mb-2">{selectedCandidate.name}</CardTitle>
                  <CardDescription className="text-lg text-slate-600 mb-3">{selectedCandidate.email}</CardDescription>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(selectedCandidate.status)}
                    <Badge variant="outline" className={`${performance.color} text-white border-0 px-3 py-1`}>
                      <PerformanceIcon className="h-4 w-4 mr-2" />
                      {performance.level}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg ${getScoreColor(finalScore)}`}>
                    {finalScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-slate-500 mt-2 font-medium">Overall Score</div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant={selectedCandidate.status === 'selected' ? 'default' : 'outline'}
                    onClick={() => handleStatusUpdate(selectedCandidate.id, 'selected')}
                    className="min-w-[120px] hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                    disabled={selectedCandidate.status === 'selected'}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    {selectedCandidate.status === 'selected' ? 'Selected' : 'Select'}
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedCandidate.status === 'under-review' ? 'default' : 'outline'}
                    onClick={() => handleStatusUpdate(selectedCandidate.id, 'under-review')}
                    className="min-w-[120px] hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                    disabled={selectedCandidate.status === 'under-review'}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {selectedCandidate.status === 'under-review' ? 'In Review' : 'Review'}
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedCandidate.status === 'rejected' ? 'default' : 'outline'}
                    onClick={() => handleStatusUpdate(selectedCandidate.id, 'rejected')}
                    className="min-w-[120px] hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                    disabled={selectedCandidate.status === 'rejected'}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    {selectedCandidate.status === 'rejected' ? 'Rejected' : 'Reject'}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{finalScore.toFixed(1)}/10</div>
              <div className="text-sm text-muted-foreground">Final Score</div>
              <Progress value={finalScore * 10} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completionRate.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{averageScore.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Avg Question Score</div>
              <Progress value={averageScore * 10} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.round(totalTimeSpent/60)}m</div>
              <div className="text-sm text-muted-foreground">Time Spent</div>
              <Progress value={(totalTimeSpent/totalTimeLimit) * 100} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {interview?.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Interview Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{interview.summary}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Question-by-Question Analysis
            </CardTitle>
            <CardDescription>
              Detailed breakdown of performance across all interview questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {interview?.questions.map((question, index) => {
                const answer = interview.answers[index];
                if (!answer) return null;

                const difficultyColors = {
                  easy: "bg-green-100 text-green-800 border-green-200",
                  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
                  hard: "bg-red-100 text-red-800 border-red-200",
                };

                return (
                  <div key={question.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <Badge className={difficultyColors[question.difficulty]}>
                          {question.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-lg">{answer.score?.toFixed(1) || 0}/10</div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{answer.timeSpent}s</div>
                          <div className="text-xs text-muted-foreground">Time Used</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">{question.text}</h4>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground mb-2">Answer:</p>
                        <p className="text-sm">{answer.text}</p>
                      </div>
                    </div>

                    {answer.feedback && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-900">
                          <strong>AI Feedback:</strong> {answer.feedback}
                        </p>
                      </div>
                    )}

                    {(answer.strengths?.length || answer.improvements?.length) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {answer.strengths && answer.strengths.length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="font-medium text-green-900 mb-2 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Strengths
                            </p>
                            <ul className="text-sm text-green-800 space-y-1">
                              {answer.strengths.map((strength, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-green-600">•</span>
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {answer.improvements && answer.improvements.length > 0 && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <p className="font-medium text-orange-900 mb-2 flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              Areas for Improvement
                            </p>
                            <ul className="text-sm text-orange-800 space-y-1">
                              {answer.improvements.map((improvement, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-orange-600">•</span>
                                  {improvement}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-3xl font-bold text-blue-700 mb-1">{completedInterviews.length}</div>
                <p className="text-blue-600 text-sm font-semibold">Total Candidates</p>
              </div>
              <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-blue-600/5 rounded-full" />
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-3xl font-bold text-green-700 mb-1">
                  {completedInterviews.filter(i => (i.finalScore || 0) >= 7).length}
                </div>
                <p className="text-green-600 text-sm font-semibold">High Performers</p>
              </div>
              <div className="w-12 h-12 bg-green-600/10 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-green-600/5 rounded-full" />
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-3xl font-bold text-purple-700 mb-1">
                  {completedInterviews.length > 0 
                    ? Math.round(completedInterviews.reduce((acc, i) => acc + (i.finalScore || 0), 0) / completedInterviews.length * 10) / 10
                    : 0}
                </div>
                <p className="text-purple-600 text-sm font-semibold">Average Score</p>
              </div>
              <div className="w-12 h-12 bg-purple-600/10 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-purple-600/5 rounded-full" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-3xl font-bold text-orange-700 mb-1">
                  {candidates.filter(c => c.status === 'selected').length}
                </div>
                <p className="text-orange-600 text-sm font-semibold">Selected</p>
              </div>
              <div className="w-12 h-12 bg-orange-600/10 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-orange-600/5 rounded-full" />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-slate-50 to-white border border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-900">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                Candidate Management Dashboard
              </CardTitle>
              <CardDescription className="text-base text-slate-600 font-medium">
                Review, evaluate, and manage interview results • 
                <span className="font-bold text-slate-900 ml-1">{filteredCandidates.length}</span> candidates available
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm text-slate-500">Last updated</div>
                <div className="text-sm font-semibold text-slate-700">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200">
                    <Trash2 className="h-4 w-4" />
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      Clear All Data
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base leading-relaxed">
                      This will permanently delete all candidates, interviews, chat history, and evaluation data. 
                      This action cannot be undone and will reset the entire application state.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="font-semibold">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearAllData} 
                      className="bg-red-600 hover:bg-red-700 font-semibold shadow-lg"
                    >
                      Clear All Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Search candidates by name or email address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 text-base border-slate-300 focus:border-slate-500 focus:ring-slate-500 bg-white shadow-sm"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex gap-3">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48 py-3 bg-white border-slate-300 focus:border-slate-500 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-500" />
                      <SelectValue placeholder="Filter by status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                        All Statuses
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        Pending Review
                      </div>
                    </SelectItem>
                    <SelectItem value="selected">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        Selected
                      </div>
                    </SelectItem>
                    <SelectItem value="under-review">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        Under Review
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        Rejected
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                  <SelectTrigger className="w-48 py-3 bg-white border-slate-300 focus:border-slate-500 shadow-sm">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-slate-500" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        Score (High to Low)
                      </div>
                    </SelectItem>
                    <SelectItem value="date">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        Date (Recent First)
                      </div>
                    </SelectItem>
                    <SelectItem value="name">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-500" />
                        Name (A-Z)
                      </div>
                    </SelectItem>
                    <SelectItem value="status">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        Status
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {(searchTerm || filterStatus !== "all") && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                <span className="text-sm font-medium text-slate-600">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    Search: &ldquo;{searchTerm}&rdquo;
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      className="ml-2 h-4 w-4 p-0 hover:bg-blue-200"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filterStatus !== "all" && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    Status: {filterStatus.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilterStatus("all")}
                      className="ml-2 h-4 w-4 p-0 hover:bg-green-200"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {filteredCandidates.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-300">
              <CardContent className="text-center py-20 bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                    <Users className="h-12 w-12 text-slate-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-700">No candidates found</h3>
                    <p className="text-slate-500 leading-relaxed">
                      {searchTerm || filterStatus !== "all" 
                        ? "Try adjusting your search criteria or filters to find the candidates you're looking for" 
                        : "Completed interviews will appear here once candidates finish their assessments. The candidate management dashboard will help you track and evaluate all applicants."
                      }
                    </p>
                  </div>
                  {(searchTerm || filterStatus !== "all") && (
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setFilterStatus("all");
                        }}
                        className="hover:bg-slate-50"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedCandidates.map((item) => {
                  const candidate = item.candidate!;
                  const getPerformanceLevel = (score: number) => {
                    if (score >= 8.5) return { level: "Outstanding", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" };
                    if (score >= 7.5) return { level: "Excellent", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" };
                    if (score >= 6.5) return { level: "Good", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
                    if (score >= 5.0) return { level: "Average", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" };
                    return { level: "Below Average", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
                  };
                  
                  const performance = getPerformanceLevel(item.finalScore || 0);
                  
                  return (
                    <Card key={candidate.id} className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.01] border border-slate-200 hover:border-blue-300 bg-white">
                      <CardContent className="p-0">
                        <div className="flex items-center">
                          <div className={`w-1 h-24 ${candidate.status === 'selected' ? 'bg-green-500' : candidate.status === 'rejected' ? 'bg-red-500' : candidate.status === 'under-review' ? 'bg-blue-500' : 'bg-gray-300'} rounded-l-lg flex-shrink-0`} />
                          
                          <div className="flex items-center justify-between w-full p-6">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <Avatar className="h-16 w-16 ring-3 ring-white shadow-lg flex-shrink-0">
                                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700">
                                  {getInitials(candidate.name)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-xl font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                                    {candidate.name}
                                  </h3>
                                  {getStatusBadge(candidate.status)}
                                </div>
                                <p className="text-slate-600 text-sm truncate mb-3 font-medium">{candidate.email}</p>
                                
                                <div className="flex items-center gap-6 text-sm">
                                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${performance.bgColor} ${performance.borderColor} border`}>
                                    <Trophy className={`h-4 w-4 ${performance.color}`} />
                                    <span className={`font-semibold ${performance.color}`}>
                                      {(item.finalScore || 0).toFixed(1)}/10
                                    </span>
                                    <span className={`text-xs ${performance.color} opacity-80`}>
                                      • {performance.level}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-slate-500">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-medium">
                                      {item.completedAt && new Date(item.completedAt).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="hidden lg:flex items-center gap-8 px-6 flex-shrink-0">
                              <div className="text-center">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${getScoreColor(item.finalScore || 0)} relative`}>
                                  <span>{(item.finalScore || 0).toFixed(1)}</span>
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                    <Trophy className={`h-3 w-3 ${performance.color}`} />
                                  </div>
                                </div>
                                <p className="text-xs text-slate-600 mt-2 font-semibold">Overall Score</p>
                              </div>
                              
                              <div className="text-center space-y-1">
                                <div className="text-2xl font-bold text-slate-700">
                                  {item.questions?.length || 0}
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Questions</p>
                                <div className="text-sm text-slate-600">
                                  {Math.round((item.answers?.reduce((acc: number, ans) => acc + (ans.timeSpent || 0), 0) || 0) / 60)}m
                                </div>
                                <p className="text-xs text-slate-500">Duration</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              <Button
                                onClick={() => setSelectedCandidate(candidate)}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="font-semibold">View Details</span>
                              </Button>
                              
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant={candidate.status === 'selected' ? 'default' : 'outline'}
                                    onClick={() => handleStatusUpdate(candidate.id, 'selected')}
                                    className={`px-3 py-1 h-8 transition-all duration-200 ${
                                      candidate.status === 'selected' 
                                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                                        : 'hover:bg-green-50 hover:border-green-300 hover:text-green-700 border-slate-300'
                                    }`}
                                    disabled={candidate.status === 'selected'}
                                  >
                                    <UserCheck className="h-3 w-3" />
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant={candidate.status === 'under-review' ? 'default' : 'outline'}
                                    onClick={() => handleStatusUpdate(candidate.id, 'under-review')}
                                    className={`px-3 py-1 h-8 transition-all duration-200 ${
                                      candidate.status === 'under-review' 
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                                        : 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 border-slate-300'
                                    }`}
                                    disabled={candidate.status === 'under-review'}
                                  >
                                    <Clock className="h-3 w-3" />
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant={candidate.status === 'rejected' ? 'default' : 'outline'}
                                    onClick={() => handleStatusUpdate(candidate.id, 'rejected')}
                                    className={`px-3 py-1 h-8 transition-all duration-200 ${
                                      candidate.status === 'rejected' 
                                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-md' 
                                        : 'hover:bg-red-50 hover:border-red-300 hover:text-red-700 border-slate-300'
                                    }`}
                                    disabled={candidate.status === 'rejected'}
                                  >
                                    <UserX className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                <div className="lg:hidden text-xs text-center">
                                  <span className="text-slate-500 font-medium">Quick Actions</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <Card className="mt-6">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-slate-600 font-medium">
                        Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{' '}
                        <span className="font-bold text-slate-900">
                          {Math.min(startIndex + CANDIDATES_PER_PAGE, filteredCandidates.length)}
                        </span>{' '}
                        of <span className="font-bold text-slate-900">{filteredCandidates.length}</span> candidates
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-10 h-10 font-bold transition-all duration-200 ${
                                  currentPage === pageNum 
                                    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg' 
                                    : 'hover:bg-slate-50 border-slate-300'
                                }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
    </div>
  );
}