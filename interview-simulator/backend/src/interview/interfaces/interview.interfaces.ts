import { ChatMessage, InterviewerResponse } from '../../openrouter/schemas';

export interface InterviewSession {
  id: string;
  /** Interview configuration */
  config: {
    role: string;
    type: 'technical' | 'behavioral' | 'mixed';
    difficulty: 'junior' | 'mid' | 'senior';
    language: 'en' | 'es';
    totalQuestions: number;
    persona: 'friendly' | 'strict' | 'casual';
    resumeText?: string;
    jobDescription?: string;
  };
  /** Full conversation history for OpenRouter */
  history: ChatMessage[];
  /** Current question number */
  currentQuestion: number;
  /** Current interview phase */
  phase: string;
  /** Whether the session has ended */
  ended: boolean;
  /** Timestamp of last activity */
  lastActivity: number;
  /** Created at */
  createdAt: number;
  /** Evaluation report (populated after end) */
  report?: InterviewReport;
}

export interface InterviewReport {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  questionScores: {
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }[];
  suggestedResources: string[];
}

export interface InterviewResponseDto {
  sessionId: string;
  response: InterviewerResponse;
}
