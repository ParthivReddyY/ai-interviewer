# AI-Powered Interview Assistant - Requirements Document

## Project Overview

**Project Name:** AI-Powered Interview Assistant (Crisp)  
**Type:** React Web Application  
**Purpose:** Create an AI-powered interview platform that enables candidates to participate in timed technical interviews while providing interviewers with a comprehensive dashboard to review and evaluate candidates.

## 1. Functional Requirements

### 1.1 Application Structure

#### 1.1.1 Two-Tab Interface
- **FR-1.1.1:** The application SHALL provide two main tabs: "Interviewee" and "Interviewer"
- **FR-1.1.2:** Both tabs SHALL remain synchronized with real-time data updates
- **FR-1.1.3:** Tab switching SHALL preserve the current state and data

### 1.2 Interviewee Tab (Candidate Interface)

#### 1.2.1 Resume Upload
- **FR-1.2.1:** The system SHALL accept PDF file uploads (required)
- **FR-1.2.2:** The system SHALL optionally accept DOCX file uploads
- **FR-1.2.3:** The system SHALL extract the following fields from uploaded resumes:
  - Name
  - Email address
  - Phone number
- **FR-1.2.4:** The system SHALL validate file types and reject invalid formats
- **FR-1.2.5:** The system SHALL provide clear error messages for invalid or corrupted files

#### 1.2.2 Data Collection
- **FR-1.2.6:** If any required field (Name, Email, Phone) is missing from the resume, the chatbot SHALL prompt the candidate to provide the missing information
- **FR-1.2.7:** The interview SHALL NOT start until all required fields are collected
- **FR-1.2.8:** The system SHALL validate email format and phone number format

#### 1.2.3 Interview Flow
- **FR-1.2.9:** The AI SHALL generate questions dynamically for a full-stack (React/Node.js) developer role
- **FR-1.2.10:** The interview SHALL consist of exactly 6 questions with the following difficulty distribution:
  - 2 Easy questions
  - 2 Medium questions  
  - 2 Hard questions
- **FR-1.2.11:** Questions SHALL be presented one at a time in sequential order
- **FR-1.2.12:** Each question SHALL have a specific time limit:
  - Easy questions: 20 seconds
  - Medium questions: 60 seconds
  - Hard questions: 120 seconds
- **FR-1.2.13:** The system SHALL display a countdown timer for each question
- **FR-1.2.14:** When time expires, the system SHALL automatically submit the current answer and proceed to the next question
- **FR-1.2.15:** Candidates SHALL be able to submit answers before the timer expires
- **FR-1.2.16:** The system SHALL show progress indication (e.g., "Question 3 of 6")

#### 1.2.4 Interview Completion
- **FR-1.2.17:** After the 6th question, the AI SHALL calculate a final score
- **FR-1.2.18:** The AI SHALL generate a short summary of the candidate's performance
- **FR-1.2.19:** The system SHALL display completion confirmation to the candidate

### 1.3 Interviewer Tab (Dashboard Interface)

#### 1.3.1 Candidate List
- **FR-1.3.1:** The dashboard SHALL display a list of all candidates who have completed or started interviews
- **FR-1.3.2:** The candidate list SHALL be ordered by final score (highest to lowest)
- **FR-1.3.3:** Each candidate entry SHALL display:
  - Name
  - Final score (if completed)
  - Interview status (completed/in-progress)
  - Date/time of interview

#### 1.3.2 Search and Filter
- **FR-1.3.4:** The system SHALL provide search functionality to find candidates by name or email
- **FR-1.3.5:** The system SHALL provide sorting options:
  - By score (ascending/descending)
  - By date (newest/oldest first)
  - By name (alphabetical)

#### 1.3.3 Detailed Candidate View
- **FR-1.3.6:** Clicking on a candidate SHALL open a detailed view containing:
  - Complete candidate profile (name, email, phone)
  - Full chat history with all questions and answers
  - Individual question scores
  - Time taken per question
  - Final AI-generated summary
  - Overall score

### 1.4 Data Persistence and Session Management

#### 1.4.1 Local Storage
- **FR-1.4.1:** The system SHALL persist all data locally using browser storage
- **FR-1.4.2:** Persisted data SHALL include:
  - Candidate profiles
  - Interview progress
  - Chat history
  - Timers state
  - Answers and scores
- **FR-1.4.3:** Data SHALL be restored when the application is reopened

#### 1.4.2 Session Recovery
- **FR-1.4.4:** If a candidate refreshes or closes the page during an interview, the system SHALL restore the previous state
- **FR-1.4.5:** For unfinished interviews, the system SHALL display a "Welcome Back" modal
- **FR-1.4.6:** The "Welcome Back" modal SHALL allow candidates to:
  - Resume the interview from where they left off
  - Start a new interview (with confirmation)

## 2. Non-Functional Requirements

### 2.1 Performance
- **NFR-2.1.1:** The application SHALL load within 3 seconds on standard broadband connections
- **NFR-2.1.2:** Resume parsing SHALL complete within 5 seconds for files up to 5MB
- **NFR-2.1.3:** Timer accuracy SHALL be within ±1 second

### 2.2 Usability
- **NFR-2.2.1:** The interface SHALL be responsive and work on desktop, tablet, and mobile devices
- **NFR-2.2.2:** The chat interface SHALL be intuitive and similar to popular messaging applications
- **NFR-2.2.3:** The dashboard SHALL provide clear visual hierarchy and easy navigation

### 2.3 Reliability
- **NFR-2.3.1:** The application SHALL handle network interruptions gracefully
- **NFR-2.3.2:** Data SHALL not be lost due to browser crashes or unexpected closures
- **NFR-2.3.3:** The system SHALL provide appropriate error messages for all failure scenarios

### 2.4 Accessibility
- **NFR-2.4.1:** The application SHALL meet WCAG 2.1 Level AA standards
- **NFR-2.4.2:** All interactive elements SHALL be keyboard accessible
- **NFR-2.4.3:** The application SHALL provide appropriate contrast ratios

## 3. Technical Requirements

### 3.1 Technology Stack
- **TR-3.1.1:** Frontend SHALL be built using React
- **TR-3.1.2:** State management SHALL use Redux with redux-persist OR equivalent
- **TR-3.1.3:** UI components SHOULD use Ant Design, shadcn, or similar modern UI library
- **TR-3.1.4:** Local storage SHALL use IndexedDB or localStorage API

### 3.2 AI Integration
- **TR-3.2.1:** The system SHALL integrate with AI APIs for:
  - Question generation
  - Answer evaluation
  - Score calculation
  - Summary generation
- **TR-3.2.2:** AI API calls SHALL include proper error handling and fallback mechanisms

### 3.3 File Processing
- **TR-3.3.1:** The system SHALL support PDF parsing for text extraction
- **TR-3.3.2:** The system SHOULD support DOCX parsing for text extraction
- **TR-3.3.3:** File size limits SHALL be enforced (maximum 10MB)

## 4. User Stories

### 4.1 Candidate User Stories
- **US-4.1.1:** As a candidate, I want to upload my resume so that the system can extract my basic information
- **US-4.1.2:** As a candidate, I want to provide missing information so that I can proceed with the interview
- **US-4.1.3:** As a candidate, I want to see a timer for each question so that I know how much time I have left
- **US-4.1.4:** As a candidate, I want to resume my interview if I accidentally close the browser
- **US-4.1.5:** As a candidate, I want to see my progress during the interview so that I know how many questions remain

### 4.2 Interviewer User Stories
- **US-4.2.1:** As an interviewer, I want to see all candidates ranked by score so that I can identify top performers
- **US-4.2.2:** As an interviewer, I want to search for specific candidates so that I can quickly find their information
- **US-4.2.3:** As an interviewer, I want to view detailed interview responses so that I can make informed hiring decisions
- **US-4.2.4:** As an interviewer, I want to see AI-generated summaries so that I can quickly understand candidate performance

## 5. Acceptance Criteria

### 5.1 Resume Upload and Processing
- ✅ User can upload PDF files successfully
- ✅ System extracts name, email, and phone when available
- ✅ System prompts for missing information before starting interview
- ✅ Invalid file types are rejected with clear error messages

### 5.2 Interview Process
- ✅ Interview consists of exactly 6 questions (2 easy, 2 medium, 2 hard)
- ✅ Questions are presented one at a time with appropriate timers
- ✅ System auto-submits when timer expires
- ✅ Progress is shown throughout the interview
- ✅ Final score and summary are generated upon completion

### 5.3 Dashboard Functionality
- ✅ All candidates are listed with scores and basic information
- ✅ Candidates are sortable by score, date, and name
- ✅ Search functionality works for names and emails
- ✅ Detailed view shows complete interview history

### 5.4 Persistence and Recovery
- ✅ All data persists across browser sessions
- ✅ Interrupted interviews can be resumed
- ✅ "Welcome Back" modal appears for unfinished sessions
- ✅ No data loss occurs during normal operation

## 6. Constraints and Assumptions

### 6.1 Constraints
- Must be deployable as a web application
- Must work without backend server (client-side only)
- Must use browser storage for persistence
- Interview must be completed in a single session (cannot span multiple days)

### 6.2 Assumptions
- Candidates have modern browsers with JavaScript enabled
- Candidates have stable internet connection for AI API calls
- Resume files contain text (not image-only scans)
- Candidates are familiar with basic web application interactions


## 7. Success Metrics

- **Functionality:** All core features working as specified
- **User Experience:** Intuitive interface with smooth interactions
- **Performance:** Fast loading and responsive design
- **Reliability:** No data loss and proper error handling
- **Code Quality:** Clean, maintainable code with proper documentation