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
import { parseResumeAction } from "@/lib/actions";
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
    location: "",
    linkedIn: "",
    github: "",
    website: "",
    summary: "",
    jobTitle: "",
    languages: "",
    certifications: "",
    projects: "",
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
      const basicData = await parseResume(file);
      
      let enhancedData;
      try {
        enhancedData = await parseResumeAction(basicData.rawText || '');
        console.log('✅ Enhanced parsing successful:', enhancedData.parsingMethod);
      } catch (error) {
        console.log('⚠️ Enhanced parsing failed, using basic data:', error);
        enhancedData = basicData;
      }
      
      const data = {
        ...basicData,
        ...enhancedData,
        rawText: basicData.rawText
      };
      
      setResumeData(data);

      const missing: string[] = [];
      if (!data.name) missing.push("name");
      if (!data.email) missing.push("email");
      if (!data.phone) missing.push("phone");

      setMissingFields(missing);

      setManualData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
        experience: data.experience || "",
        education: data.education || "",
        location: data.location || "",
        linkedIn: data.linkedIn || "",
        github: data.github || "",
        website: data.website || "",
        summary: data.summary || "",
        jobTitle: data.jobTitle || "",
        languages: Array.isArray(data.languages) ? data.languages.join(", ") : "",
        certifications: Array.isArray(data.certifications) ? data.certifications.join(", ") : "",
        projects: Array.isArray(data.projects) ? data.projects.join("\n• ") : "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process resume");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateCandidate = () => {
    if (!manualData.name || !manualData.email || !manualData.phone) {
      setError("Please fill in all required fields");
      return;
    }

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

        <div className="space-y-6">
          {/* Required Information */}
          <div className="bg-red-50/50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
              <span className="text-red-500">*</span>
              Required Information
            </h4>
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
          </div>

          {/* Professional Information */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Professional Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Current Job Title</Label>
                <Input
                  id="jobTitle"
                  value={manualData.jobTitle}
                  onChange={(e) => setManualData({ ...manualData, jobTitle: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={manualData.location}
                  onChange={(e) => setManualData({ ...manualData, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  value={manualData.summary}
                  onChange={(e) => setManualData({ ...manualData, summary: e.target.value })}
                  placeholder="Brief professional summary highlighting your key strengths and experience..."
                  className="min-h-[60px]"
                />
              </div>
            </div>
          </div>

          {/* Technical Skills & Experience */}
          <div className="bg-green-50/50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3">Technical Information</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skills">Technical Skills</Label>
                <Textarea
                  id="skills"
                  value={manualData.skills}
                  onChange={(e) => setManualData({ ...manualData, skills: e.target.value })}
                  placeholder="e.g., JavaScript, React, Python, Node.js, AWS, Docker (comma-separated)"
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
                <Label htmlFor="projects">Projects</Label>
                <Textarea
                  id="projects"
                  value={manualData.projects}
                  onChange={(e) => setManualData({ ...manualData, projects: e.target.value })}
                  placeholder="Describe your key projects, technologies used, and achievements..."
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">Include project descriptions, technologies, and outcomes</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="languages">Programming Languages</Label>
                  <Input
                    id="languages"
                    value={manualData.languages}
                    onChange={(e) => setManualData({ ...manualData, languages: e.target.value })}
                    placeholder="e.g., English, Spanish, French"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications</Label>
                  <Input
                    id="certifications"
                    value={manualData.certifications}
                    onChange={(e) => setManualData({ ...manualData, certifications: e.target.value })}
                    placeholder="e.g., AWS Certified, Google Cloud"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Education & Links */}
          <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-3">Education & Links</h4>
            <div className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedIn">LinkedIn Profile</Label>
                  <Input
                    id="linkedIn"
                    value={manualData.linkedIn}
                    onChange={(e) => setManualData({ ...manualData, linkedIn: e.target.value })}
                    placeholder="https://linkedin.com/in/yourname"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github">GitHub Profile</Label>
                  <Input
                    id="github"
                    value={manualData.github}
                    onChange={(e) => setManualData({ ...manualData, github: e.target.value })}
                    placeholder="https://github.com/yourname"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Personal Website</Label>
                  <Input
                    id="website"
                    value={manualData.website}
                    onChange={(e) => setManualData({ ...manualData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
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
      <Label 
        htmlFor="resume-upload" 
        className="block cursor-pointer"
      >
        <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50/50 transition-all duration-200">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4">
              <Upload className="h-16 w-16 text-gray-400 mx-auto" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-700">
                Click to Upload Your Resume
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to select PDF or DOCX files (max 10MB)
              </p>
              <p className="text-xs text-muted-foreground">
                Auto-extracts skills, experience, education, and contact details
              </p>
            </div>
            
            <div className="mt-4 px-4 py-2 bg-primary/10 rounded-full">
              <span className="text-xs font-medium text-primary">
                AI-Powered Parsing
              </span>
            </div>
          </CardContent>
        </Card>
      </Label>
      
      <Input
        id="resume-upload"
        type="file"
        accept=".pdf,.docx,.doc"
        onChange={handleFileChange}
        className="hidden"
      />

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