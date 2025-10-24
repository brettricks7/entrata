import { z } from 'zod';

export const QuestionSchema = z.object({
	id: z.string().min(1),
	prompt: z.string().min(1),
	options: z.array(z.string().min(1)).length(4),
	correctIndex: z.number().int().min(0).max(3)
});

export const QuizSchema = z.object({
	topic: z.string().min(1),
	questions: z.array(QuestionSchema).length(5)
});

export type Quiz = z.infer<typeof QuizSchema>;
export type Question = z.infer<typeof QuestionSchema>;

export const QUIZ_SCHEMA_VERSION = '1.0.0';
