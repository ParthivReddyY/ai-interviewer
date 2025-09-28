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

import { EMAIL_REGEX, PHONE_REGEX, isValidEmail, cleanPhoneNumber } from './validation';

const NAME_PATTERNS = [
  /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/m, 
  /Name:\s*([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i, 
  /([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*\n/m, 
  /^([A-Z]+\s[A-Z]+(?:\s[A-Z]+)?)/m, 
  /([A-Z][a-zA-Z]+ [A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)\s*$/m, 
];

export async function parsePDF(file: File): Promise<ResumeData> {
  if (typeof window === 'undefined') {
    return {
      name: undefined,
      email: undefined,
      phone: undefined,
      rawText: `PDF file uploaded: ${file.name}. Server-side parsing not available. Please manually enter your information below.`,
    };
  }

  try {
    const pdfjs = await import('pdfjs-dist');
    const { getDocument, GlobalWorkerOptions } = pdfjs;
    
    GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.mjs`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
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
    
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value.trim()) {
      throw new Error('Could not extract text from DOCX file. The file might be corrupted or empty.');
    }
    
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
  
  const basicData = extractBasicInfo(text, lines);
  
  const missingCriticalInfo = !basicData.name || !basicData.email || !basicData.phone;
  
  if (missingCriticalInfo && typeof window !== 'undefined') {
    try {
      const { parseResumeAction } = await import('@/lib/actions');
      const aiEnhanced = await parseResumeAction(text);
      
      return {
        name: aiEnhanced.name || basicData.name,
        email: aiEnhanced.email || basicData.email,
        phone: aiEnhanced.phone || basicData.phone,
        rawText: text,
        skills: aiEnhanced.skills || basicData.skills,
        experience: aiEnhanced.experience || basicData.experience,
        education: aiEnhanced.education || basicData.education,
      };
    } catch (error) {
      console.log('AI enhancement failed, using basic extraction:', error);
    }
  }
  
  return basicData;
}

function extractBasicInfo(text: string, lines: string[]): ResumeData {
  const emailMatches = text.match(EMAIL_REGEX);
  const email = emailMatches ? emailMatches[0] : undefined;
  
  const phoneMatches = text.match(PHONE_REGEX);
  const phone = phoneMatches ? phoneMatches[0] : undefined;
  
  let name: string | undefined;
  
  for (const pattern of NAME_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      name = match[1].trim();
      break;
    }
  }
  
  if (!name && lines.length > 0) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
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
  
  const validEmail = email && isValidEmail(email) ? email : undefined;
  
  const cleanPhone = phone ? cleanPhoneNumber(phone) : undefined;
  
  return {
    name,
    email: validEmail,
    phone: cleanPhone,
    rawText: text,
  };
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
  
  if (file.size > 10 * 1024 * 1024) { 
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