import { z } from 'zod';

const learnerAttemptSchema = z.object({
  round: z.number().int().min(0).max(3),
  question: z.string().trim().min(1).max(4_000),
  answer: z.string().trim().min(1).max(8_000),
});

export const analysisRequestSchema = z.object({
  concept: z.string().trim().min(1).max(500),
  question: z.string().trim().min(1).max(4_000),
  answer: z.string().trim().min(1).max(8_000),
  round: z.coerce.number().int().min(0).max(3).default(0),
  history: z.array(learnerAttemptSchema).max(3).default([]),
});

export type LearnerAttempt = z.infer<typeof learnerAttemptSchema>;

export const analysisSchema = z.object({
  difficultyType: z.enum([
    'Vocabulary difficulty',
    'Conceptual misunderstanding',
    'Sequential/process difficulty',
    'Information overload',
    'Persistent misconception'
  ]),

  confidence: z.number().min(0).max(100),

  diagnosis: z.string(),

  evidence: z.array(z.string()).min(1).max(3),

  strategy: z.string(),

  representation: z.enum([
    'Simplified Text',
    'Visual / Structured Explanation',
    'Example / Analogy-Based Explanation'
  ]),

  adaptedExplanation: z.string(),

  // IMPORTANT:
  // This must be a NEW question generated from the learner's
  // latest response and detected difficulty.
  nextQuestion: z.string(),

  whyItChanged: z.string(),

  masteryStatus: z.enum([
    'mastered',
    'continue',
    'needs_support'
  ])
});

export type Analysis = z.infer<typeof analysisSchema>;
