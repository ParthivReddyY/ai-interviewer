import mammoth from 'mammoth';

export interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  rawText: string;
}

// Email regex pattern
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Phone regex pattern (supports various formats)
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;

// Name extraction patterns (look for common resume patterns)
const NAME_PATTERNS = [
  /^([A-Z][a-z]+ [A-Z][a-z]+)/m, // First Last at start of line
  /Name:\s*([A-Z][a-z]+ [A-Z][a-z]+)/i, // "Name: First Last"
  /([A-Z][a-z]+ [A-Z][a-z]+)\s*\n/m, // Name followed by newline
];

export async function parsePDF(file: File): Promise<ResumeData> {
  try {
    // For now, we'll return a fallback result for PDFs
    // Users will need to manually enter their information
    return {
      name: undefined,
      email: undefined,
      phone: undefined,
      rawText: `PDF file uploaded: ${file.name}. Please manually enter your information below.`,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

export async function parseDOCX(file: File): Promise<ResumeData> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return extractResumeData(result.value);
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

function extractResumeData(text: string): ResumeData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Extract email
  const emailMatch = text.match(EMAIL_REGEX);
  const email = emailMatch ? emailMatch[0] : undefined;
  
  // Extract phone
  const phoneMatch = text.match(PHONE_REGEX);
  const phone = phoneMatch ? phoneMatch[0] : undefined;
  
  // Extract name - try multiple patterns
  let name: string | undefined;
  for (const pattern of NAME_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      name = match[1].trim();
      break;
    }
  }
  
  // If no name found, try the first line that looks like a name
  if (!name && lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.split(' ').length >= 2 && 
        firstLine.length < 50 && 
        /^[A-Za-z\s]+$/.test(firstLine)) {
      name = firstLine;
    }
  }
  
  return {
    name,
    email,
    phone,
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