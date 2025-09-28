"use client";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Users, Trophy, Clock, Search, FileText, 
         CheckCircle, XCircle, AlertCircle, Award, Target, TrendingUp, ChevronLeft, ChevronRight,
         UserCheck, UserX, Eye, Trash2, BarChart3 } from "lucide-react";
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

  // Get completed interviews with candidate data
  const completedInterviews = interviews
    .filter((interview) => interview.status === "completed")
    .map((interview) => ({
      ...interview,
      candidate: candidates.find((c) => c.id === interview.candidateId),
    }))
    .filter((item) => item.candidate);

  // Filter and sort candidates
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

  // Pagination
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
    
    // Calculate performance metrics
    const completionRate = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    const averageScore = (interview?.answers?.length || 0) > 0 
      ? interview!.answers.reduce((acc, ans) => acc + (ans.score || 0), 0) / interview!.answers.length 
      : 0;

    // Categorize performance
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button variant="outline" onClick={() => setSelectedCandidate(null)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate(selectedCandidate.id, 'selected')}
              className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
              disabled={selectedCandidate.status === 'selected'}
            >
              <UserCheck className="h-4 w-4" />
              Select Candidate
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate(selectedCandidate.id, 'under-review')}
              className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
              disabled={selectedCandidate.status === 'under-review'}
            >
              <Eye className="h-4 w-4" />
              Keep for Review
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate(selectedCandidate.id, 'rejected')}
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
              disabled={selectedCandidate.status === 'rejected'}
            >
              <UserX className="h-4 w-4" />
              Reject Candidate
            </Button>
          </div>
        </div>

        {/* Enhanced Candidate Info Card */}
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

              {/* Score Display and Quick Actions */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg ${getScoreColor(finalScore)}`}>
                    {finalScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-slate-500 mt-2 font-medium">Overall Score</div>
                </div>

                {/* Quick Action Buttons */}
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

        {/* Performance Metrics */}
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

        {/* Interview Summary */}
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

        {/* Detailed Question Analysis */}
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
      {/* Enhanced Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-700">{completedInterviews.length}</div>
              <p className="text-blue-600 text-sm">Total Candidates</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="flex items-center p-6">
            <Trophy className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-700">
                {completedInterviews.filter(i => (i.finalScore || 0) >= 7).length}
              </div>
              <p className="text-green-600 text-sm">High Performers</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-700">
                {completedInterviews.length > 0 
                  ? Math.round(completedInterviews.reduce((acc, i) => acc + (i.finalScore || 0), 0) / completedInterviews.length * 10) / 10
                  : 0}
              </div>
              <p className="text-purple-600 text-sm">Average Score</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-orange-700">
                {candidates.filter(c => c.status === 'selected').length}
              </div>
              <p className="text-orange-600 text-sm">Selected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search and Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Candidate Dashboard
              </CardTitle>
              <CardDescription>
                Review and manage interview results • {filteredCandidates.length} candidates
              </CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all candidates, interviews, and chat history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData} className="bg-red-600 hover:bg-red-700">
                    Clear All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search candidates by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score (High to Low)</SelectItem>
                <SelectItem value="date">Date (Recent First)</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-dashed border-slate-300">
              <Users className="h-16 w-16 text-slate-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-600 mb-3">No candidates found</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all" ? "Try adjusting your search or filters to find candidates" : "Completed interviews will appear here once candidates finish their assessments"}
              </p>
            </div>
          ) : (
            <>
              {/* Horizontal Candidate List */}
              <div className="space-y-4">
                {paginatedCandidates.map((item) => {
                  const candidate = item.candidate!;
                  return (
                    <Card key={candidate.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.01] border-l-4 border-l-transparent hover:border-l-blue-500 bg-gradient-to-r from-white to-slate-50/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          {/* Left side - Candidate Info */}
                          <div className="flex items-center space-x-4 flex-1">
                            <Avatar className="h-14 w-14 ring-2 ring-slate-200">
                              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700">
                                {getInitials(candidate.name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-semibold text-slate-900 truncate">
                                  {candidate.name}
                                </h3>
                                {getStatusBadge(candidate.status)}
                              </div>
                              <p className="text-slate-600 text-sm truncate mb-2">{candidate.email}</p>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <div className="flex items-center gap-1">
                                  <Trophy className="h-4 w-4" />
                                  <span className="font-medium">{(item.finalScore || 0).toFixed(1)}/10</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{item.completedAt && new Date(item.completedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right side - Score Display and Action Buttons */}
                          <div className="flex items-center gap-6">
                            {/* Score Circle */}
                            <div className="text-center">
                              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${getScoreColor(item.finalScore || 0)}`}>
                                {(item.finalScore || 0).toFixed(1)}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">Overall Score</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedCandidate(candidate)}
                                className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(candidate.id, 'selected')}
                                className="hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                                disabled={candidate.status === 'selected'}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Select
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(candidate.id, 'under-review')}
                                className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                                disabled={candidate.status === 'under-review'}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(candidate.id, 'rejected')}
                                className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                                disabled={candidate.status === 'rejected'}
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + CANDIDATES_PER_PAGE, filteredCandidates.length)} of {filteredCandidates.length} candidates
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
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
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}