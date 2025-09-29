import mammoth from 'mammoth';

export interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  rawText: string;
  skills?: string[];
  experience?: string;
  education?: string;
  location?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  summary?: string;
  jobTitle?: string;
  languages?: string[];
  certifications?: string[];
  projects?: string[];
  // AI-enhanced categorization
  skillCategories?: {
    programming: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    cloud: string[];
    other: string[];
  };
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  industryFocus?: string[];
}

import { EMAIL_REGEX, PHONE_REGEX, isValidEmail, cleanPhoneNumber } from './validation';

const NAME_PATTERNS = [
  /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/m, 
  /Name:\s*([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i, 
  /([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*\n/m, 
  /^([A-Z]+\s[A-Z]+(?:\s[A-Z]+)?)/m, 
  /([A-Z][a-zA-Z]+ [A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)\s*$/m, 
];

// Enhanced pattern matching for additional fields
const LINKEDIN_REGEX = /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([a-zA-Z0-9\-]+)/gi;
const GITHUB_REGEX = /(?:github\.com\/)([a-zA-Z0-9\-\.]+)/gi;
const WEBSITE_REGEX = /(https?:\/\/)?(?:www\.)?([a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,})/gi;
const LOCATION_PATTERNS = [
  /(?:Location|Address|City|State):\s*([A-Za-z\s,]+(?:,\s*[A-Z]{2})?)/i,
  /([A-Za-z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?)/,
  /([A-Za-z\s]+,\s*[A-Za-z\s]+(?:,\s*[A-Za-z\s]+)?)/
];

const SKILLS_PATTERNS = [
  /(?:Skills?|Technical Skills?|Programming Languages?|Technologies?):\s*([^\n]+(?:\n[^\n:]+)*)/i,
  /(?:Proficient in|Experience with|Familiar with):\s*([^\n]+)/i
];

const EDUCATION_PATTERNS = [
  /(?:Education|Academic Background|Degree):\s*([^\n]+(?:\n[^\n:]+)*)/i,
  /(Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|MBA)[^\n]+/gi,
  /(?:University|College|Institute)[^\n]+/gi
];

const EXPERIENCE_PATTERNS = [
  /(?:Experience|Work Experience|Professional Experience|Employment):\s*([^\n]+(?:\n[^\n:]+)*)/i,
  /(?:Software Engineer|Developer|Manager|Analyst|Consultant)[^\n]+/gi
];

const JOBTITLE_PATTERNS = [
  /(?:Title|Position|Role|Current Position):\s*([^\n]+)/i,
  /(Software Engineer|Web Developer|Full Stack Developer|Frontend Developer|Backend Developer|DevOps Engineer|Data Scientist|Product Manager|Software Architect)/i
];

const SUMMARY_PATTERNS = [
  /(?:Summary|Profile|About|Overview|Professional Summary):\s*([^\n]+(?:\n[^\n:]+)*)/i,
  /(?:Objective|Career Objective):\s*([^\n]+(?:\n[^\n:]+)*)/i
];

const CERTIFICATION_PATTERNS = [
  /(?:Certifications?|Certificates?):\s*([^\n]+(?:\n[^\n:]+)*)/i,
  /(AWS|Azure|Google Cloud|Microsoft|Oracle|Cisco|CompTIA)[^\n]*(?:Certified|Certification)/gi
];

const LANGUAGE_PATTERNS = [
  /(?:Languages?):\s*([^\n]+)/i,
  /(?:Fluent in|Speaks?|Native):\s*([^\n]+)/i
];

const PROJECT_PATTERNS = [
  /(?:Projects?|Personal Projects?|Key Projects?):\s*([^\n]+(?:\n[^\n:]+)*)/i,
  /(?:Portfolio|Notable Work|Project Experience):\s*([^\n]+(?:\n[^\n:]+)*)/i,
  /(Project Name|Project Title):\s*([^\n]+)/gi,
  /(?:Built|Developed|Created|Implemented)\s+([^\n.!?]+(?:application|app|website|system|platform|tool|API|service))/gi
];

// AI-powered categorization mappings
const SKILL_CATEGORIES = {
  programming: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Ruby', 'Scala', 'Clojure', 'Dart', 'R', 'MATLAB'],
  frameworks: ['React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET', 'Laravel', 'Rails', 'Next.js', 'Nuxt.js', 'Svelte', 'FastAPI', 'Gin'],
  databases: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB', 'Oracle', 'SQLite', 'MariaDB', 'CouchDB', 'Neo4j'],
  tools: ['Git', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'GitHub Actions', 'Terraform', 'Ansible', 'Webpack', 'Vite', 'Babel', 'ESLint', 'Prettier', 'Jest', 'Cypress'],
  cloud: ['AWS', 'Azure', 'GCP', 'Google Cloud', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean', 'Cloudflare', 'Firebase', 'Supabase'],
  other: ['REST', 'GraphQL', 'gRPC', 'Microservices', 'Agile', 'Scrum', 'DevOps', 'CI/CD', 'Machine Learning', 'AI', 'Blockchain', 'IoT']
};

const EXPERIENCE_LEVEL_INDICATORS = {
  entry: ['intern', 'junior', 'associate', 'entry', 'graduate', 'trainee', '0-2 years', 'fresh'],
  mid: ['developer', 'engineer', 'analyst', '2-5 years', '3-7 years', 'mid-level'],
  senior: ['senior', 'lead', 'principal', '5+ years', '7+ years', 'expert', 'specialist'],
  lead: ['team lead', 'tech lead', 'staff', 'principal', 'architect', 'manager'],
  executive: ['director', 'vp', 'cto', 'ceo', 'head of', 'chief']
};

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
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit.');
    }

    const pdfjs = await import('pdfjs-dist');
    const { getDocument, GlobalWorkerOptions } = pdfjs;
    
    // Use matching version for worker - use the same version as the imported pdfjs-dist
    GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    
    const arrayBuffer = await file.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('File appears to be empty.');
    }

    const pdf = await getDocument({ 
      data: arrayBuffer,
      verbosity: 0 // Reduce console noise
    }).promise;
    
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 5); // Limit to first 5 pages for performance
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((item: any) => item.str && typeof item.str === 'string')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => item.str.trim())
          .filter(str => str.length > 0)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n';
        }
      } catch (pageError) {
        console.warn(`Error parsing page ${pageNum}:`, pageError);
        continue; // Skip this page and continue with others
      }
    }
    
    if (!fullText.trim()) {
      throw new Error('Could not extract readable text from PDF. The file might be image-based, corrupted, or password-protected.');
    }
    
    return await extractResumeData(fullText);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while parsing PDF';
    return {
      name: undefined,
      email: undefined,
      phone: undefined,
      rawText: `PDF file uploaded: ${file.name}. Text extraction failed: ${errorMessage}. Please manually enter your information below.`,
    };
  }
}

export async function parseDOCX(file: File): Promise<ResumeData> {
  try {
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit.');
    }

    if (file.size === 0) {
      throw new Error('File appears to be empty.');
    }

    const arrayBuffer = await file.arrayBuffer();
    
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value || !result.value.trim()) {
      throw new Error('Could not extract readable text from DOCX file. The file might be corrupted, password-protected, or empty.');
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

export async function extractResumeData(text: string): Promise<ResumeData> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const basicData = extractBasicInfo(text, lines);
  
  // Always try AI enhancement for better categorization and project extraction
  if (typeof window !== 'undefined') {
    try {
      const aiEnhanced = await enhanceWithAI(text, basicData);
      return aiEnhanced;
    } catch (error) {
      console.log('AI enhancement failed, using fallback extraction:', error);
    }
  }
  
  return basicData;
}

async function enhanceWithAI(text: string, basicData: ResumeData): Promise<ResumeData> {
  try {
    // Use AI to extract and categorize additional information
    const { generateContentWithRetry } = await import('@/services/aiConfig');
    
    const prompt = `Analyze this resume text and extract structured information in JSON format:

RESUME TEXT:
${text}

Extract and return ONLY a JSON object with these fields:
{
  "projects": ["project1 description", "project2 description"],
  "skillCategories": {
    "programming": ["language1", "language2"],
    "frameworks": ["framework1", "framework2"],
    "databases": ["db1", "db2"],
    "tools": ["tool1", "tool2"],
    "cloud": ["platform1", "platform2"],
    "other": ["skill1", "skill2"]
  },
  "experienceLevel": "entry|mid|senior|lead|executive",
  "industryFocus": ["industry1", "industry2"],
  "enhancedSummary": "improved professional summary",
  "keyAchievements": ["achievement1", "achievement2"]
}

Focus on:
1. Extract specific projects with descriptions
2. Categorize technical skills properly
3. Determine experience level from job titles and years
4. Identify industry focus areas
5. Keep arrays concise (max 10 items each)`;

    const aiResponse = await generateContentWithRetry(prompt);
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const aiData = JSON.parse(jsonMatch[0]);
      
      return {
        ...basicData,
        projects: aiData.projects || basicData.projects,
        skillCategories: aiData.skillCategories || categorizeSkills(basicData.skills || []),
        experienceLevel: aiData.experienceLevel || determineExperienceLevel(text),
        industryFocus: aiData.industryFocus || extractIndustryFocus(text),
        summary: aiData.enhancedSummary || basicData.summary,
      };
    }
  } catch (error) {
    console.log('AI enhancement failed:', error);
  }
  
  // Fallback to rule-based enhancement
  return {
    ...basicData,
    projects: extractProjects(text),
    skillCategories: categorizeSkills(basicData.skills || []),
    experienceLevel: determineExperienceLevel(text),
    industryFocus: extractIndustryFocus(text),
  };
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
  
  // Extract additional fields
  const linkedIn = extractLinkedIn(text);
  const github = extractGitHub(text);
  const website = extractWebsite(text);
  const location = extractLocation(text);
  const skills = extractSkills(text);
  const education = extractEducation(text);
  const experience = extractExperience(text);
  const jobTitle = extractJobTitle(text);
  const summary = extractSummary(text);
  const certifications = extractCertifications(text);
  const languages = extractLanguages(text);
  const projects = extractProjects(text);
  
  return {
    name,
    email: validEmail,
    phone: cleanPhone,
    rawText: text,
    linkedIn,
    github,
    website,
    location,
    skills,
    education,
    experience,
    jobTitle,
    summary,
    certifications,
    languages,
    projects,
    skillCategories: categorizeSkills(skills),
    experienceLevel: determineExperienceLevel(text),
    industryFocus: extractIndustryFocus(text),
  };
}

// Helper functions for extracting additional fields
function extractLinkedIn(text: string): string | undefined {
  const match = text.match(LINKEDIN_REGEX);
  if (match) {
    return match[0].includes('http') ? match[0] : `https://${match[0]}`;
  }
  return undefined;
}

function extractGitHub(text: string): string | undefined {
  const match = text.match(GITHUB_REGEX);
  if (match) {
    return match[0].includes('http') ? match[0] : `https://${match[0]}`;
  }
  return undefined;
}

function extractWebsite(text: string): string | undefined {
  const matches = Array.from(text.matchAll(WEBSITE_REGEX));
  const filtered = matches.filter(match => 
    !match[0].includes('linkedin.com') && 
    !match[0].includes('github.com') && 
    !match[0].includes('mailto:')
  );
  if (filtered.length > 0) {
    const site = filtered[0][0];
    return site.includes('http') ? site : `https://${site}`;
  }
  return undefined;
}

function extractLocation(text: string): string | undefined {
  for (const pattern of LOCATION_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractSkills(text: string): string[] {
  const skills: string[] = [];
  
  // Try pattern matching first
  for (const pattern of SKILLS_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const skillList = match[1]
        .split(/[,\n\|;•-]/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 1 && skill.length < 50)
        .map(skill => skill.replace(/^[-•*]\s*/, '')); // Remove bullet points
      skills.push(...skillList);
    }
  }
  
  // Enhanced tech keyword detection
  const techKeywords = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin',
    'PHP', 'Ruby', 'Scala', 'Clojure', 'Dart', 'R', 'MATLAB', 'C', 'Objective-C',
    
    // Web Technologies
    'HTML', 'CSS', 'SCSS', 'SASS', 'Less', 'Tailwind', 'Bootstrap',
    
    // Frontend Frameworks/Libraries
    'React', 'Vue', 'Angular', 'Svelte', 'jQuery', 'Next.js', 'Nuxt.js', 'Gatsby',
    
    // Backend Frameworks
    'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'ASP.NET', 'Laravel',
    'Rails', 'Ruby on Rails', 'Gin', 'Echo', 'Fiber',
    
    // Databases
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB',
    'Oracle', 'SQLite', 'MariaDB', 'CouchDB', 'Neo4j', 'Firebase', 'Supabase',
    
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Google Cloud', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean',
    'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'GitHub Actions', 'Terraform', 'Ansible',
    
    // Tools & Other
    'Git', 'CI/CD', 'REST', 'GraphQL', 'gRPC', 'Microservices', 'Webpack', 'Vite', 'Babel',
    'ESLint', 'Prettier', 'Jest', 'Cypress', 'Selenium', 'Postman'
  ];
  
  // Look for keywords in text
  techKeywords.forEach(keyword => {
    const variations = [
      keyword,
      keyword.toLowerCase(),
      keyword.replace(/[.\s]/g, ''), // Remove dots and spaces
      keyword.replace('.js', '') // Handle .js frameworks
    ];
    
    variations.forEach(variation => {
      const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(text) && !skills.some(skill => 
        skill.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(skill.toLowerCase())
      )) {
        skills.push(keyword);
      }
    });
  });
  
  // Also look for skills in bullet point lists
  const bulletPoints = text.match(/^[\s]*[-•*]\s*(.+)$/gm);
  if (bulletPoints) {
    bulletPoints.forEach(point => {
      const cleaned = point.replace(/^[\s]*[-•*]\s*/, '').trim();
      if (cleaned.length > 2 && cleaned.length < 50) {
        // Check if it looks like a skill
        const looksLikeSkill = /^[A-Za-z0-9\s.+#-]+$/.test(cleaned) && 
                              !cleaned.toLowerCase().includes('experience') &&
                              !cleaned.toLowerCase().includes('responsible') &&
                              !cleaned.toLowerCase().includes('developed') &&
                              !cleaned.toLowerCase().includes('managed');
        if (looksLikeSkill) {
          skills.push(cleaned);
        }
      }
    });
  }
  
  return [...new Set(skills)].slice(0, 20); // Remove duplicates and limit
}

function extractEducation(text: string): string | undefined {
  for (const pattern of EDUCATION_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractExperience(text: string): string | undefined {
  // Try pattern matching first
  for (const pattern of EXPERIENCE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 800); // Increased limit
    }
  }
  
  // Look for job titles and company names
  const jobTitlePatterns = [
    /(?:Software|Web|Frontend|Backend|Full Stack|Senior|Junior|Lead|Principal)\s+(?:Engineer|Developer|Architect|Manager)/gi,
    /(?:Data|DevOps|Site Reliability|Systems|Network|Security)\s+Engineer/gi,
    /(?:Product|Project|Engineering|Technical)\s+Manager/gi,
    /(?:CTO|CEO|VP|Director|Head)\s+of/gi
  ];
  
  const experienceEntries: string[] = [];
  
  jobTitlePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Look for context around the job title
        const index = text.indexOf(match);
        const context = text.substring(Math.max(0, index - 50), index + 200);
        const lines = context.split('\n').filter(line => line.trim().length > 0);
        
        // Try to get a complete experience entry
        const experienceEntry = lines.join(' ').trim();
        if (experienceEntry.length > 20) {
          experienceEntries.push(experienceEntry);
        }
      });
    }
  });
  
  if (experienceEntries.length > 0) {
    return experienceEntries.join('\n\n').substring(0, 800);
  }
  
  return undefined;
}

function extractJobTitle(text: string): string | undefined {
  for (const pattern of JOBTITLE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

function extractSummary(text: string): string | undefined {
  for (const pattern of SUMMARY_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 300); // Limit length
    }
  }
  return undefined;
}

function extractCertifications(text: string): string[] {
  const certs: string[] = [];
  
  for (const pattern of CERTIFICATION_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const certList = match[1]
        .split(/[,\n\|;]/)
        .map(cert => cert.trim())
        .filter(cert => cert.length > 3);
      certs.push(...certList);
    }
  }
  
  return [...new Set(certs)].slice(0, 10); // Remove duplicates and limit
}

function extractLanguages(text: string): string[] {
  const langs: string[] = [];
  
  for (const pattern of LANGUAGE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const langList = match[1]
        .split(/[,\n\|;]/)
        .map(lang => lang.trim())
        .filter(lang => lang.length > 1 && lang.length < 20);
      langs.push(...langList);
    }
  }
  
  return [...new Set(langs)].slice(0, 8); // Remove duplicates and limit
}

function extractProjects(text: string): string[] {
  const projects: string[] = [];
  
  // Try pattern matching first
  for (const pattern of PROJECT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const projectText = match[1];
      // Split by common project separators
      const projectList = projectText
        .split(/\n\s*[-•*]|\n\n/)
        .map(project => project.trim())
        .filter(project => project.length > 10 && project.length < 300)
        .map(project => project.replace(/^[-•*]\s*/, '')); // Remove bullet points
      projects.push(...projectList);
    }
  }
  
  // Look for project descriptions with action verbs
  const projectIndicators = [
    'developed', 'built', 'created', 'implemented', 'designed', 'architected',
    'established', 'launched', 'delivered', 'engineered', 'constructed', 'deployed'
  ];
  
  const applicationTypes = [
    'application', 'app', 'website', 'system', 'platform', 'tool', 'API', 'service',
    'portal', 'dashboard', 'interface', 'framework', 'library', 'component',
    'solution', 'product', 'software', 'program'
  ];
  
  // Look for bullet points that describe projects
  const bulletPoints = text.match(/^[\s]*[-•*]\s*(.+)$/gm);
  if (bulletPoints) {
    bulletPoints.forEach(point => {
      const cleaned = point.replace(/^[\s]*[-•*]\s*/, '').trim();
      const lowerPoint = cleaned.toLowerCase();
      
      // Check if it's describing a project (has action + application type)
      const hasProjectIndicator = projectIndicators.some(indicator => lowerPoint.includes(indicator));
      const hasApplicationType = applicationTypes.some(type => lowerPoint.includes(type));
      
      if ((hasProjectIndicator && hasApplicationType) || 
          (lowerPoint.includes('project') && cleaned.length > 20)) {
        projects.push(cleaned);
      }
    });
  }
  
  // Look for sentences that describe projects
  const sentences = text.split(/[.!?]/);
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    const lowerSentence = trimmed.toLowerCase();
    
    if (trimmed.length > 30 && trimmed.length < 200) {
      const hasProjectIndicator = projectIndicators.some(indicator => lowerSentence.includes(indicator));
      const hasApplicationType = applicationTypes.some(type => lowerSentence.includes(type));
      
      if (hasProjectIndicator && hasApplicationType) {
        projects.push(trimmed);
      }
    }
  });
  
  // Look for explicit project sections with titles
  const projectTitlePattern = /(?:project|portfolio)\s*(?:name|title)?\s*:?\s*([^\n]+)/gi;
  let match;
  while ((match = projectTitlePattern.exec(text)) !== null) {
    if (match[1] && match[1].length > 5) {
      projects.push(match[1].trim());
    }
  }
  
  return [...new Set(projects)].slice(0, 10); // Remove duplicates and limit
}

function categorizeSkills(skills: string[]): ResumeData['skillCategories'] {
  const categories = {
    programming: [] as string[],
    frameworks: [] as string[],
    databases: [] as string[],
    tools: [] as string[],
    cloud: [] as string[],
    other: [] as string[]
  };
  
  skills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    let categorized = false;
    
    Object.entries(SKILL_CATEGORIES).forEach(([category, categorySkills]) => {
      if (categorySkills.some(catSkill => skillLower.includes(catSkill.toLowerCase()))) {
        const categoryKey = category as keyof typeof categories;
        categories[categoryKey].push(skill);
        categorized = true;
      }
    });
    
    if (!categorized) {
      categories.other.push(skill);
    }
  });
  
  return categories;
}

function determineExperienceLevel(text: string): ResumeData['experienceLevel'] {
  const textLower = text.toLowerCase();
  
  for (const [level, indicators] of Object.entries(EXPERIENCE_LEVEL_INDICATORS)) {
    if (indicators.some(indicator => textLower.includes(indicator))) {
      return level as ResumeData['experienceLevel'];
    }
  }
  
  // Fallback: try to extract years of experience
  const yearsMatch = text.match(/(\d+)[\s+-]*years?\s+of\s+experience/i);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    if (years < 2) return 'entry';
    if (years < 5) return 'mid';
    if (years < 8) return 'senior';
    if (years < 12) return 'lead';
    return 'executive';
  }
  
  return 'mid'; // Default fallback
}

function extractIndustryFocus(text: string): string[] {
  const industries = [
    'fintech', 'healthcare', 'e-commerce', 'education', 'gaming', 
    'enterprise', 'startup', 'consulting', 'banking', 'insurance',
    'retail', 'manufacturing', 'automotive', 'aerospace', 'energy',
    'media', 'entertainment', 'government', 'non-profit', 'blockchain'
  ];
  
  const textLower = text.toLowerCase();
  const foundIndustries: string[] = [];
  
  industries.forEach(industry => {
    if (textLower.includes(industry)) {
      foundIndustries.push(industry);
    }
  });
  
  return foundIndustries;
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