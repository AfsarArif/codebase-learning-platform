import { z } from 'zod';

// ─── Repository Validation ───────────────────────────────────────────────────

export const importRepoUrlSchema = z.object({
  url: z
    .string()
    .url()
    .regex(
      /^https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+(\/tree\/[a-zA-Z0-9._-]+\/.+)?\/?$/,
      'Must be a valid GitHub repository URL',
    ),
  branch: z.string().optional(),
});

export const githubRepoUrlSchema = z
  .string()
  .url()
  .regex(/^https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+/);

// ─── Chat Validation ─────────────────────────────────────────────────────────

export const chatRequestSchema = z.object({
  threadId: z.string().optional(),
  message: z.string().min(1).max(10000),
  mode: z.enum(['explain', 'quiz', 'interview', 'beginner', 'advanced']).optional(),
});

// ─── Interview Validation ────────────────────────────────────────────────────

export const interviewStartSchema = z.object({
  mode: z.enum(['conceptual', 'implementation', 'debug', 'system_design']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'mixed']).optional(),
  focusAreas: z
    .array(
      z.enum([
        'api',
        'database',
        'frontend',
        'backend',
        'testing',
        'infrastructure',
        'security',
        'architecture',
      ]),
    )
    .optional(),
  questionCount: z.number().min(5).max(50).optional(),
});

export const interviewAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string().min(1).max(5000),
});

// ─── Study Material Validation ───────────────────────────────────────────────

export const generateStudyMaterialSchema = z.object({
  type: z.enum(['flashcards', 'quiz', 'all']),
  count: z.number().min(1).max(100).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  focusAreas: z
    .array(
      z.enum([
        'api',
        'database',
        'frontend',
        'backend',
        'testing',
        'infrastructure',
        'security',
        'architecture',
      ]),
    )
    .optional(),
});

// ─── Progress Validation ─────────────────────────────────────────────────────

export const lessonCompleteSchema = z.object({
  lessonId: z.string(),
  status: z.enum(['completed', 'mastered']),
  masteryScore: z.number().min(0).max(100).optional(),
});

// ─── Resync Validation ───────────────────────────────────────────────────────

export const resyncSchema = z.object({
  force: z.boolean().optional(),
  branch: z.string().optional(),
});
