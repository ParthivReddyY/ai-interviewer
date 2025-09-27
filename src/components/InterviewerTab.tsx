"use client";
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, ChevronDown, Users, Trophy, Clock } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Candidate } from "@/types";

export default function InterviewerTab() {
  const { candidates, interviews } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "date" | "name">("score");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

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
      if (!searchTerm) return true;
      const candidate = item.candidate!;
      return (
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (b.finalScore || 0) - (a.finalScore || 0);
        case "date":
          return new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime();
        case "name":
          return a.candidate!.name.localeCompare(b.candidate!.name);
        default:
          return 0;
      }
    });

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

  if (selectedCandidate) {
    const interview = interviews.find((i) => i.candidateId === selectedCandidate.id);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setSelectedCandidate(null)}>
            ← Back to Dashboard
          </Button>
          <Badge variant="outline" className="px-3 py-1">
            Score: {interview?.finalScore || 0}/10
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {getInitials(selectedCandidate.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{selectedCandidate.name}</CardTitle>
                <CardDescription className="text-base">
                  {selectedCandidate.email} • {selectedCandidate.phone}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Interview Summary */}
              {interview?.summary && (
                <div>
                  <h3 className="font-semibold mb-2">Interview Summary</h3>
                  <p className="text-muted-foreground">{interview.summary}</p>
                </div>
              )}

              {/* Questions and Answers */}
              <div>
                <h3 className="font-semibold mb-4">Interview Details</h3>
                <div className="space-y-4">
                  {interview?.questions.map((question, index) => {
                    const answer = interview.answers.find((a) => a.questionId === question.id);
                    return (
                      <Card key={question.id}>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="capitalize">
                                {question.difficulty}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Question {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium mb-2">{question.text}</p>
                              <p className="text-muted-foreground text-sm">
                                {answer?.text || "No answer provided"}
                              </p>
                            </div>
                            {answer && (
                              <div className="flex items-center justify-between text-sm">
                                <span>
                                  Time: {answer.timeSpent}s / {question.timeLimit}s
                                </span>
                                <Badge variant="outline">
                                  Score: {answer.score || 0}/10
                                </Badge>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{candidates.length}</p>
              <p className="text-sm text-muted-foreground">Total Candidates</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Trophy className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">{completedInterviews.length}</p>
              <p className="text-sm text-muted-foreground">Completed Interviews</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {interviews.filter((i) => i.status === "in-progress").length}
              </p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Dashboard</CardTitle>
          <CardDescription>
            Review and manage interview results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Button
                variant={sortBy === "score" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("score")}
              >
                Score
              </Button>
              <Button
                variant={sortBy === "date" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("date")}
              >
                Date
              </Button>
              <Button
                variant={sortBy === "name" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("name")}
              >
                Name
              </Button>
            </div>
          </div>

          {/* Candidates List */}
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {completedInterviews.length === 0
                  ? "No completed interviews yet"
                  : "No candidates match your search"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCandidates.map((item) => (
                <Card
                  key={item.candidate!.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedCandidate(item.candidate!)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(item.candidate!.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{item.candidate!.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.candidate!.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(
                          item.finalScore || 0
                        )}`}
                      >
                        {item.finalScore || 0}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(item.completedAt || 0).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.questions.length} questions
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400 rotate-270" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}