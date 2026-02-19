import { z } from 'zod';

// ── Allowed values (used for prompt guidance, not strict validation) ──
const FACIAL_EXPRESSIONS = [
  'default', 'smile', 'sad', 'angry', 'surprised',
  'thinking', 'serious', 'curious', 'friendly', 'concerned',
  'encouraging', 'neutral', 'happy', 'empathetic',
] as const;

const ANIMATIONS = [
  'Idle', 'Talking', 'Nodding', 'HeadShake',
  'ThumbsUp', 'Waving', 'Thinking',
] as const;

const EMOTIONS = [
  'neutral', 'happy', 'empathetic', 'encouraging',
  'serious', 'curious', 'friendly', 'concerned',
] as const;

/**
 * Coerce an unknown string to the closest valid value, or return a fallback.
 * This prevents the AI model from crashing the app with an unexpected value.
 */
function coerceEnum<T extends string>(allowed: readonly T[], fallback: T) {
  return z.string().transform((val): T => {
    const lower = val.toLowerCase().trim();
    const match = allowed.find((a) => a.toLowerCase() === lower);
    return match ?? fallback;
  });
}

// ── Individual message from the interviewer ────────────────
export const InterviewerMessageSchema = z.object({
  text: z.string().min(1),
  facialExpression: coerceEnum(FACIAL_EXPRESSIONS, 'default'),
  animation: coerceEnum(ANIMATIONS, 'Talking'),
  emotion: coerceEnum(EMOTIONS, 'neutral'),
});

// ── Metadata about the interview progress ──────────────────
export const InterviewMetadataSchema = z.object({
  questionNumber: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  phase: z.enum([
    'greeting',
    'warmup',
    'technical',
    'behavioral',
    'situational',
    'closing',
  ]),
  scoreHint: z.number().min(0).max(10).nullish(),
});

// ── Full interviewer response ──────────────────────────────
export const InterviewerResponseSchema = z.object({
  messages: z.array(InterviewerMessageSchema).min(1),
  metadata: InterviewMetadataSchema,
});

export type InterviewerMessage = z.infer<typeof InterviewerMessageSchema>;
export type InterviewMetadata = z.infer<typeof InterviewMetadataSchema>;
export type InterviewerResponse = z.infer<typeof InterviewerResponseSchema>;

// ── OpenRouter chat message ────────────────────────────────
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ── OpenRouter API response ────────────────────────────────
export const OpenRouterChoiceSchema = z.object({
  message: z.object({
    role: z.literal('assistant'),
    content: z.string(),
  }),
  finish_reason: z.string().optional(),
});

export const OpenRouterResponseSchema = z.object({
  id: z.string(),
  choices: z.array(OpenRouterChoiceSchema).min(1),
  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
});

export type OpenRouterResponse = z.infer<typeof OpenRouterResponseSchema>;

// ── Interview evaluation/report schema ─────────────────────
export const QuestionScoreSchema = z.object({
  question: z.string().min(1),
  answer: z.string(),
  score: z.number().min(1).max(10),
  feedback: z.string().min(1),
});

export const InterviewReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  strengths: z.array(z.string()).min(1),
  improvements: z.array(z.string()).min(1),
  questionScores: z.array(QuestionScoreSchema).min(1),
  suggestedResources: z.array(z.string()),
});

export type InterviewReportParsed = z.infer<typeof InterviewReportSchema>;

