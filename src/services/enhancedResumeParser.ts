'use server';

import { generateContentWithRetry } from './aiConfig';
import type { ResumeData } from '@/utils/fileParser';
import { extractResumeData } from '@/utils/fileParser';

export interface AIResumeData extends ResumeData {
  parsingMethod: 'ai' | 'fallback' | 'hybrid';
  confidence: number;
  missingFields: string[];
}

export async function parseResumeWithAI(resumeText: string): Promise<AIResumeData> {
  console.log('🤖 Starting AI-powered resume parsing...');
  
  try {
    // First, try AI parsing
    const aiResult = await parseWithAI(resumeText);
    
    if (aiResult.confidence >= 0.7) {
      console.log('✅ AI parsing successful with high confidence');
      return aiResult;
    }
    
    console.log('⚠️ AI parsing had low confidence, using hybrid approach');
    return await createHybridResult(resumeText, aiResult);
    
  } catch (error) {
    console.log('❌ AI parsing failed, falling back to rule-based parsing:', error);
    return await createFallbackResult(resumeText);
  }
}

async function parseWithAI(resumeText: string): Promise<AIResumeData> {
  const prompt = `You are an expert resume parser. Analyze this resume and extract structured information with high accuracy.

RESUME TEXT:
${resumeText}

Return ONLY a JSON object with this exact structure (use null for missing fields):
{
  "name": "Full Name or null",
  "email": "email@example.com or null",
  "phone": "+1234567890 or null",
  "location": "City, State/Country or null",
  "linkedIn": "https://linkedin.com/in/profile or null",
  "github": "https://github.com/username or null",
  "website": "https://website.com or null",
  "jobTitle": "Current/Most Recent Job Title or null",
  "summary": "Professional summary or objective or null",
  "skills": ["skill1", "skill2"] or null,
  "experience": "Detailed work experience or null",
  "education": "Education details or null",
  "certifications": ["cert1", "cert2"] or null,
  "languages": ["English", "Spanish"] or null,
  "projects": ["Project 1: Description", "Project 2: Description"] or null,
  "confidence": 0.95
}

IMPORTANT: Return ONLY the JSON object, no other text.`;

  const response = await generateContentWithRetry(prompt, 2);
  
  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response');
  }
  
  const aiData = JSON.parse(jsonMatch[0]);
  
  // Create structured result
  const result: AIResumeData = {
    name: aiData.name || undefined,
    email: aiData.email || undefined,
    phone: aiData.phone || undefined,
    rawText: resumeText,
    location: aiData.location || undefined,
    linkedIn: aiData.linkedIn || undefined,
    github: aiData.github || undefined,
    website: aiData.website || undefined,
    jobTitle: aiData.jobTitle || undefined,
    summary: aiData.summary || undefined,
    skills: Array.isArray(aiData.skills) ? aiData.skills : undefined,
    experience: aiData.experience || undefined,
    education: aiData.education || undefined,
    certifications: Array.isArray(aiData.certifications) ? aiData.certifications : undefined,
    languages: Array.isArray(aiData.languages) ? aiData.languages : undefined,
    projects: Array.isArray(aiData.projects) ? aiData.projects : undefined,
    parsingMethod: 'ai',
    confidence: Math.min(1.0, Math.max(0.1, aiData.confidence || 0.5)),
    missingFields: []
  };
  
  result.missingFields = findMissingFields(result);
  
  return result;
}

async function createHybridResult(resumeText: string, aiResult: AIResumeData): Promise<AIResumeData> {
  console.log('🔄 Creating hybrid parsing result...');
  
  try {
    // Get fallback parsing results
    const fallbackResult = await extractResumeData(resumeText);
    
    // Merge AI and fallback results
    const hybridResult: AIResumeData = {
      rawText: resumeText,
      parsingMethod: 'hybrid',
      confidence: (aiResult.confidence + 0.6) / 2,
      missingFields: [],
      // Use AI result first, then fallback
      name: aiResult.name || fallbackResult.name,
      email: aiResult.email || fallbackResult.email,
      phone: aiResult.phone || fallbackResult.phone,
      location: aiResult.location || fallbackResult.location,
      linkedIn: aiResult.linkedIn || fallbackResult.linkedIn,
      github: aiResult.github || fallbackResult.github,
      website: aiResult.website || fallbackResult.website,
      jobTitle: aiResult.jobTitle || fallbackResult.jobTitle,
      summary: aiResult.summary || fallbackResult.summary,
      experience: aiResult.experience || fallbackResult.experience,
      education: aiResult.education || fallbackResult.education,
      // Merge arrays
      skills: mergeArrays(aiResult.skills, fallbackResult.skills).slice(0, 30),
      certifications: mergeArrays(aiResult.certifications, fallbackResult.certifications).slice(0, 15),
      languages: mergeArrays(aiResult.languages, fallbackResult.languages).slice(0, 10),
      projects: mergeArrays(aiResult.projects, fallbackResult.projects).slice(0, 10),
      // Use fallback for complex fields if AI didn't provide them
      skillCategories: aiResult.skillCategories || fallbackResult.skillCategories,
      experienceLevel: aiResult.experienceLevel || fallbackResult.experienceLevel,
      industryFocus: mergeArrays(aiResult.industryFocus, fallbackResult.industryFocus).slice(0, 8)
    };
    
    hybridResult.missingFields = findMissingFields(hybridResult);
    
    console.log('✅ Hybrid parsing completed');
    return hybridResult;
    
  } catch (error) {
    console.error('❌ Hybrid parsing failed:', error);
    return await createFallbackResult(resumeText);
  }
}

async function createFallbackResult(resumeText: string): Promise<AIResumeData> {
  console.log('🔄 Using fallback parsing...');
  
  try {
    const fallbackResult = await extractResumeData(resumeText);
    
    const result: AIResumeData = {
      ...fallbackResult,
      rawText: resumeText,
      parsingMethod: 'fallback',
      confidence: 0.6,
      missingFields: []
    };
    
    result.missingFields = findMissingFields(result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Fallback parsing failed:', error);
    
    return {
      name: undefined,
      email: undefined,
      phone: undefined,
      rawText: resumeText,
      parsingMethod: 'fallback',
      confidence: 0.1,
      missingFields: ['name', 'email', 'phone']
    };
  }
}

// Helper functions
function mergeArrays(arr1?: string[], arr2?: string[]): string[] {
  const combined = [...(arr1 || []), ...(arr2 || [])];
  return [...new Set(combined)]; // Remove duplicates
}

function findMissingFields(data: Partial<ResumeData>): string[] {
  const requiredFields = ['name', 'email', 'phone'];
  const optionalFields = ['location', 'skills', 'experience', 'education'];
  
  const missing: string[] = [];
  
  requiredFields.forEach(field => {
    if (!data[field as keyof ResumeData]) {
      missing.push(field);
    }
  });
  
  optionalFields.forEach(field => {
    const value = data[field as keyof ResumeData];
    if (!value || (Array.isArray(value) && value.length === 0)) {
      missing.push(field);
    }
  });
  
  return missing;
}