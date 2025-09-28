import mammoth from 'mammoth';

export interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  rawText: string;
  skills?: string[];
  experience?: string;
  education?: string;
}

// Email regex pattern - more comprehensive
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Phone regex patterns (supports various international formats)
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})|(?:\+\d{1,3}[-.\s]?)?(?:\(?\d{1,4}\)?[-.\s]?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;

// Name extraction patterns (improved for various resume formats)
const NAME_PATTERNS = [
  /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/m, // First Last [Middle] at start
  /Name:\s*([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i, // "Name: First Last [Middle]"
  /([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*\n/m, // Name followed by newline
  /^([A-Z]+\s[A-Z]+(?:\s[A-Z]+)?)/m, // ALL CAPS names
  /([A-Z][a-zA-Z]+ [A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)\s*$/m, // Name at end of line
];

export async function parsePDF(file: File): Promise<ResumeData> {
  // Check if we're in the browser environment
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      name: undefined,
      email: undefined,
      phone: undefined,
      rawText: `PDF file uploaded: ${file.name}. Server-side parsing not available. Please manually enter your information below.`,
    };
  }

  try {
    // Dynamic import to avoid SSR issues
    const pdfjs = await import('pdfjs-dist');
    const { getDocument, GlobalWorkerOptions } = pdfjs;
    
    // Configure PDF.js worker - use a reliable CDN with the correct version
    GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.mjs`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items
      const pageText = textContent.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((item: any) => item.str)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    if (!fullText.trim()) {
      throw new Error('Could not extract text from PDF. The PDF might be image-based or corrupted.');
    }
    
    return await extractResumeData(fullText);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    // Fallback for PDFs that can't be parsed
    return {
      name: undefined,
      email: undefined,
      phone: undefined,
      rawText: `PDF file uploaded: ${file.name}. Text extraction failed. Please manually enter your information below.`,
    };
  }
}

export async function parseDOCX(file: File): Promise<ResumeData> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Use mammoth to extract text with better formatting
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value.trim()) {
      throw new Error('Could not extract text from DOCX file. The file might be corrupted or empty.');
    }
    
    // Log any conversion messages for debugging
    if (result.messages.length > 0) {
      console.warn('DOCX conversion messages:', result.messages);
    }
    
    return await extractResumeData(result.value);
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error(`Failed to parse DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractResumeData(text: string): Promise<ResumeData> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Enhanced extraction with AI-powered analysis fallback
  const basicData = extractBasicInfo(text, lines);
  
  // Try AI-powered extraction if basic extraction fails or is incomplete
  const missingCriticalInfo = !basicData.name || !basicData.email || !basicData.phone;
  
  if (missingCriticalInfo) {
    try {
      const aiEnhanced = await enhanceWithAI(text, basicData);
      return aiEnhanced;
    } catch (error) {
      console.log('AI enhancement failed, using basic extraction:', error);
      return basicData;
    }
  }
  
  return basicData;
}

function extractBasicInfo(text: string, lines: string[]): ResumeData {
  // Extract email with improved regex
  const emailMatches = text.match(EMAIL_REGEX);
  const email = emailMatches ? emailMatches[0] : undefined;
  
  // Extract phone with improved regex
  const phoneMatches = text.match(PHONE_REGEX);
  const phone = phoneMatches ? phoneMatches[0] : undefined;
  
  // Extract name - try multiple patterns
  let name: string | undefined;
  
  // Try various patterns for name extraction
  for (const pattern of NAME_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      name = match[1].trim();
      break;
    }
  }
  
  // If no name found, try the first line that looks like a name
  if (!name && lines.length > 0) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      // Check if line looks like a name (2-4 words, no numbers, reasonable length)
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 4 && 
          line.length < 50 && line.length > 5 &&
          /^[A-Za-z\s.'-]+$/.test(line) &&
          !line.toLowerCase().includes('resume') &&
          !line.toLowerCase().includes('curriculum') &&
          !line.toLowerCase().includes('cv')) {
        name = line;
        break;
      }
    }
  }
  
  // Additional email validation
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // Invalid email format, clear it
  }
  
  // Clean up phone number
  let cleanPhone = phone;
  if (cleanPhone) {
    // Remove extra formatting and keep only digits and basic formatting
    cleanPhone = cleanPhone.replace(/[^\d\-\(\)\+\s]/g, '');
  }
  
  return {
    name,
    email,
    phone: cleanPhone,
    rawText: text,
  };
}

async function enhanceWithAI(text: string, basicData: ResumeData): Promise<ResumeData> {
  // Only use AI if we're in browser and have missing critical info
  if (typeof window === 'undefined') {
    return basicData;
  }

  try {
    // Dynamic import to avoid SSR issues
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();
    if (!API_KEY) {
      return basicData;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are an expert resume parser. Analyze this resume text and extract structured information.
      
      RESUME TEXT:
      ${text.slice(0, 3000)}
      
      CURRENT EXTRACTED DATA:
      Name: ${basicData.name || 'Not found'}
      Email: ${basicData.email || 'Not found'}
      Phone: ${basicData.phone || 'Not found'}
      
      INSTRUCTIONS:
      1. Extract or improve the person's full name (avoid company names, headers, or titles)
      2. Find valid email address(es) 
      3. Locate phone number(s) in any format
      4. Identify key technical and soft skills
      5. Summarize work experience and key achievements
      6. Extract education details (degrees, institutions, years)
      
      IMPORTANT: 
      - Only extract information that is clearly present in the text
      - If information is missing or unclear, use null or empty array
      - Focus on accuracy over completeness
      - For skills, prioritize technical skills but include important soft skills
      
      Return ONLY valid JSON in this exact format:
      {
        "name": "Full Name or null",
        "email": "email@domain.com or null", 
        "phone": "+1-555-0123 or null",
        "skills": ["JavaScript", "React", "Python", "Leadership"],
        "experience": "Brief summary of work experience and key achievements",
        "education": "Degree, Institution, Year - multiple entries separated by semicolons"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();
    
    // Extract JSON from AI response with multiple patterns
    let jsonText = '';
    
    // Try different JSON extraction patterns
    let jsonMatch = aiText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
    }
    
    if (jsonText) {
      try {
        const aiData = JSON.parse(jsonText);
        
        // Validate and clean AI data
        const cleanName = aiData.name && aiData.name !== 'null' ? aiData.name.trim() : null;
        const cleanEmail = aiData.email && aiData.email !== 'null' && aiData.email.includes('@') ? aiData.email.trim() : null;
        const cleanPhone = aiData.phone && aiData.phone !== 'null' ? aiData.phone.trim() : null;
        
        // Merge AI data with basic data, preferring valid non-empty values
        return {
          name: cleanName || basicData.name,
          email: cleanEmail || basicData.email,
          phone: cleanPhone || basicData.phone,
          rawText: text,
          skills: Array.isArray(aiData.skills) ? aiData.skills.filter((skill: string) => skill && skill.length > 0) : undefined,
          experience: aiData.experience && aiData.experience.length > 10 ? aiData.experience : undefined,
          education: aiData.education && aiData.education.length > 5 ? aiData.education : undefined
        };
      } catch (parseError) {
        console.log('Failed to parse AI JSON response:', parseError);
      }
    }
    
    return basicData;
  } catch (error) {
    console.log('AI enhancement failed:', error);
    return basicData;
  }
}

export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  
  return allowedTypes.includes(file.type);
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export async function parseResume(file: File): Promise<ResumeData> {
  if (!validateFileType(file)) {
    throw new Error('Invalid file type. Only PDF and DOCX files are allowed.');
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File size too large. Maximum size is 10MB.');
  }
  
  const extension = getFileExtension(file.name);
  
  switch (extension) {
    case 'pdf':
      return parsePDF(file);
    case 'docx':
    case 'doc':
      return parseDOCX(file);
    default:
      throw new Error('Unsupported file format');
  }
}