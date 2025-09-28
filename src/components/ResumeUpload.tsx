"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { parseResume } from "@/utils/fileParser";
import type { ResumeData } from "@/utils/fileParser";
import { isValidEmail } from "@/utils/validation";

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [manualData, setManualData] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "",
    experience: "",
    education: "",
  });

  const { createCandidate } = useAppStore();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      const data = await parseResume(file);
      setResumeData(data);

      // Check for missing fields
      const missing: string[] = [];
      if (!data.name) missing.push("name");
      if (!data.email) missing.push("email");
      if (!data.phone) missing.push("phone");

      setMissingFields(missing);

      // Always show the form so users can review and edit extracted information
      setManualData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
        experience: data.experience || "",
        education: data.education || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process resume");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateCandidate = () => {
    // Validate all fields are present
    if (!manualData.name || !manualData.email || !manualData.phone) {
      setError("Please fill in all required fields");
      return;
    }

    // Email validation
    if (!isValidEmail(manualData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    createCandidate({
      name: manualData.name,
      email: manualData.email,
      phone: manualData.phone,
      resumeContent: resumeData?.rawText,
      skills: manualData.skills ? manualData.skills.split(",").map(s => s.trim()).filter(s => s.length > 0) : resumeData?.skills,
      experience: manualData.experience || resumeData?.experience,
      education: manualData.education || resumeData?.education,
    });
  };

  // If we have extracted data, show the review and edit form
  if (resumeData) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {missingFields.length > 0 
              ? "We extracted some information from your resume, but need a few more details. Please review and complete the information below."
              : "Great! We extracted information from your resume. Please review and edit if needed before starting your interview."
            }
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name {missingFields.includes("name") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="name"
                value={manualData.name}
                onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
                placeholder="Enter your full name"
                className={missingFields.includes("name") ? "border-red-300" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address {missingFields.includes("email") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="email"
                type="email"
                value={manualData.email}
                onChange={(e) => setManualData({ ...manualData, email: e.target.value })}
                placeholder="Enter your email address"
                className={missingFields.includes("email") ? "border-red-300" : ""}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">
                Phone Number {missingFields.includes("phone") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={manualData.phone}
                onChange={(e) => setManualData({ ...manualData, phone: e.target.value })}
                placeholder="Enter your phone number"
                className={missingFields.includes("phone") ? "border-red-300" : ""}
              />
            </div>
          </div>

          {/* Enhanced Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">Additional Information (Optional)</h4>
            
            <div className="space-y-2">
              <Label htmlFor="skills">Technical Skills</Label>
              <Textarea
                id="skills"
                value={manualData.skills}
                onChange={(e) => setManualData({ ...manualData, skills: e.target.value })}
                placeholder="e.g., JavaScript, React, Python, SQL, Project Management (comma-separated)"
                className="min-h-[60px]"
              />
              <p className="text-xs text-muted-foreground">Separate multiple skills with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Work Experience Summary</Label>
              <Textarea
                id="experience"
                value={manualData.experience}
                onChange={(e) => setManualData({ ...manualData, experience: e.target.value })}
                placeholder="Brief summary of your work experience and key achievements..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Education</Label>
              <Textarea
                id="education"
                value={manualData.education}
                onChange={(e) => setManualData({ ...manualData, education: e.target.value })}
                placeholder="e.g., Bachelor's in Computer Science, University Name, 2020"
                className="min-h-[60px]"
              />
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleCreateCandidate} className="w-full">
          Start Interview
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <div className="text-center">
            <Label htmlFor="resume-upload" className="cursor-pointer">
              <span className="text-lg font-medium">Upload your resume</span>
              <p className="text-sm text-muted-foreground mt-1">
                Supports PDF and DOCX files (max 10MB)
              </p>
            </Label>
            <Input
              id="resume-upload"
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {file && (
        <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
          <FileText className="h-5 w-5 text-blue-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Resume...
              </>
            ) : (
              "Upload & Parse"
            )}
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}