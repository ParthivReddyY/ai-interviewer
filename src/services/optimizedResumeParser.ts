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
  console.log('🤖 Starting optimized AI-powered resume parsing...');
  
  const ruleBasedResult = await extractResumeData(resumeText);
  
  const hasEssentialInfo = ruleBasedResult.name && ruleBasedResult.email && ruleBasedResult.phone;
  const hasGoodInfo = hasEssentialInfo && (ruleBasedResult.skills?.length || ruleBasedResult.experience);
  
  if (hasGoodInfo) {
    console.log('✅ Rule-based parsing found comprehensive info, skipping AI call');
    const result: AIResumeData = {
      ...ruleBasedResult,
      parsingMethod: 'fallback',
      confidence: 0.8,
      missingFields: findMissingFields(ruleBasedResult)
    };
    return result;
  }
  
  try {
    console.log('📡 Rule-based parsing incomplete, using AI enhancement...');
    const aiResult = await parseWithAI(resumeText);
    
    if (aiResult.confidence >= 0.6) {
      console.log(`✅ AI parsing successful with ${aiResult.confidence} confidence`);
      return aiResult;
    }
    
    console.log('⚠️ AI parsing had low confidence, using enhanced hybrid approach');
    return await createOptimizedHybridResult(resumeText, ruleBasedResult, aiResult);
    
  } catch (error) {
    console.log('❌ AI parsing failed, using enhanced rule-based result:', error);
    return await createFallbackResult(resumeText);
  }
}

async function parseWithAI(resumeText: string): Promise<AIResumeData> {
  const prompt = `You are an expert resume parser. Analyze this resume efficiently and extract all available structured information.

RESUME TEXT:
${resumeText}

Extract ALL available information and return ONLY a JSON object with this structure:
{
  "name": "Full Name or null",
  "email": "email@example.com or null", 
  "phone": "+1234567890 or null",
  "location": "City, State/Country or null",
  "linkedIn": "linkedin.com/in/profile or null",
  "github": "github.com/username or null",
  "website": "website.com or null",
  "jobTitle": "Current/Recent Job Title or null",
  "summary": "Professional summary or null",
  "skills": ["skill1", "skill2"] or null,
  "experience": "Work experience details or null",
  "education": "Education details or null", 
  "certifications": ["cert1", "cert2"] or null,
  "languages": ["English", "Spanish"] or null,
  "projects": ["Project: Description"] or null,
  "confidence": 0.85
}

CRITICAL: Return ONLY the JSON object, no other text. Set confidence between 0.1-1.0 based on data quality.`;

  const response = await generateContentWithRetry(prompt, 1);
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response');
  }
  
  const aiData = JSON.parse(jsonMatch[0]);
  
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

async function createOptimizedHybridResult(
  resumeText: string, 
  ruleBasedResult: ResumeData, 
  aiResult: AIResumeData
): Promise<AIResumeData> {
  console.log('🔄 Creating optimized hybrid parsing result...');
  
  try {
    const merged: AIResumeData = {
      name: aiResult.name || ruleBasedResult.name,
      email: aiResult.email || ruleBasedResult.email,
      phone: aiResult.phone || ruleBasedResult.phone,
      rawText: resumeText,
      location: aiResult.location || ruleBasedResult.location,
      linkedIn: aiResult.linkedIn || ruleBasedResult.linkedIn,
      github: aiResult.github || ruleBasedResult.github,
      website: aiResult.website || ruleBasedResult.website,
      jobTitle: aiResult.jobTitle || ruleBasedResult.jobTitle,
      summary: aiResult.summary || ruleBasedResult.summary,
      skills: mergeArrays(aiResult.skills, ruleBasedResult.skills),
      experience: aiResult.experience || ruleBasedResult.experience,
      education: aiResult.education || ruleBasedResult.education,
      certifications: mergeArrays(aiResult.certifications, ruleBasedResult.certifications),
      languages: mergeArrays(aiResult.languages, ruleBasedResult.languages),
      projects: mergeArrays(aiResult.projects, ruleBasedResult.projects),
      parsingMethod: 'hybrid',
      confidence: Math.min(0.9, aiResult.confidence + 0.1),
      missingFields: []
    };
    
    merged.missingFields = findMissingFields(merged);
    
    return merged;
    
  } catch (error) {
    console.error('❌ Hybrid result creation failed:', error);
    return await createFallbackResult(resumeText);
  }
}

async function createFallbackResult(resumeText: string): Promise<AIResumeData> {
  console.log('🔄 Using optimized fallback parsing...');
  
  try {
    const fallbackResult = await extractResumeData(resumeText);
    
    const result: AIResumeData = {
      ...fallbackResult,
      parsingMethod: 'fallback',
      confidence: 0.7,
      missingFields: findMissingFields(fallbackResult)
    };
    
    return result;
  } catch (error) {
    console.error('❌ Fallback parsing failed:', error);
    
    return {
      name: undefined,
      email: undefined,
      phone: undefined,
      rawText: resumeText,
      parsingMethod: 'fallback',
      confidence: 0.3,
      missingFields: ['name', 'email', 'phone', 'skills', 'experience', 'education']
    };
  }
}

function mergeArrays(arr1?: string[], arr2?: string[]): string[] | undefined {
  if (!arr1 && !arr2) return undefined;
  const combined = [...(arr1 || []), ...(arr2 || [])];
  return [...new Set(combined)]; 
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
    if (!data[field as keyof ResumeData] || 
        (Array.isArray(data[field as keyof ResumeData]) && !(data[field as keyof ResumeData] as string[])?.length)) {
      missing.push(field);
    }
  });
  
  return missing;
}