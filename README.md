# AI Interviewer

An intelligent interview platform that conducts automated technical interviews for full-stack developers. Built with Next.js and powered by AI, it provides a complete interview experience for both candidates and interviewers.

## What it does

This application simulates a real technical interview where candidates upload their resume, answer 6 progressively challenging questions, and receive instant AI-powered evaluation. Interviewers can review all candidates through a comprehensive dashboard with detailed performance analytics.

## Key Features

### For Candidates
- **Smart Resume Processing** - Upload your PDF or DOCX resume and let AI extract your details
- **Timed Technical Questions** - Answer 6 carefully crafted questions (2 easy, 2 medium, 2 hard)
- **Real-time Timer** - Each question has specific time limits to simulate real interview pressure
- **Session Recovery** - Accidentally closed the browser? No problem, resume right where you left off
- **Instant Feedback** - Get your score and personalized summary immediately after completing

### For Interviewers  
- **Candidate Dashboard** - View all candidates ranked by performance
- **Detailed Analytics** - See complete interview transcripts, individual question scores, and response times
- **Smart Search & Filtering** - Quickly find candidates by name, email, or sort by various criteria
- **AI-Generated Insights** - Get comprehensive summaries of each candidate's strengths and areas for improvement

### Technical Highlights
- **Offline-First** - Everything works without a backend server, using smart browser storage
- **AI-Powered** - Uses Google's Generative AI for question generation and answer evaluation
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Type-Safe** - Built with TypeScript for better code quality and developer experience

## Getting Started

### Prerequisites
You'll need Node.js 18+ and npm installed on your machine.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ParthivReddyY/ai-interviewer.git
cd ai-interviewer
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
Create a `.env.local` file in the root directory and add your Google AI API key:
```
GOOGLE_AI_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the application.

## How to Use

### For Candidates
1. **Upload Resume** - Start by uploading your PDF or DOCX resume
2. **Provide Details** - Fill in any missing information the AI couldn't extract
3. **Start Interview** - Begin your timed technical interview
4. **Answer Questions** - Respond to 6 questions of increasing difficulty
5. **Get Results** - View your score and detailed feedback

### For Interviewers
1. **Switch to Interviewer Tab** - Click the "Interviewer" tab at the top
2. **Browse Candidates** - See all candidates sorted by their scores
3. **Review Performance** - Click on any candidate to see their full interview details
4. **Use Filters** - Search by name or sort by different criteria to find specific candidates

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand for global state
- **AI Integration**: Google Generative AI
- **File Processing**: PDF.js for resume parsing
- **Storage**: Browser localStorage for persistence
- **Icons**: Lucide React

## Features in Detail

### Smart Resume Processing
- Automatically extracts name, email, and phone number from PDF/DOCX files
- Handles missing information gracefully by asking candidates directly
- Validates file types and provides clear error messages

### Dynamic Interview System
- **Easy Questions** (20 seconds each): Basic concepts and syntax
- **Medium Questions** (60 seconds each): Problem-solving and practical knowledge  
- **Hard Questions** (120 seconds each): Complex scenarios and best practices
- Auto-submits answers when time runs out
- Shows real-time progress throughout the interview

### Intelligent Evaluation
- AI analyzes answers for technical accuracy and completeness
- Provides detailed scoring for each individual question
- Generates personalized feedback highlighting strengths and improvement areas
- Calculates overall performance score

### Persistent Data Storage
- All interview data is saved locally in your browser
- Resume interrupted interviews seamlessly
- No data is lost even if you accidentally close the browser
- Works completely offline after initial AI API calls

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your `GOOGLE_AI_API_KEY` environment variable
4. Deploy with one click

### Other Platforms
This app works on any platform that supports Next.js, including Netlify, Railway, and traditional hosting providers.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/ParthivReddyY/ai-interviewer/issues) on GitHub.
