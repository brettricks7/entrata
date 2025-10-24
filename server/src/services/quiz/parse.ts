import { z } from 'zod';
import { QuizSchema, type Quiz } from './schema.js';

function clamp(num: number, min: number, max: number) {
	return Math.max(min, Math.min(num, max));
}

export function validateQuizStrict(obj: unknown): Quiz {
	return QuizSchema.parse(obj);
}

export function tryValidateQuiz(obj: unknown): { ok: true; quiz: Quiz } | { ok: false; error: z.ZodError } {
	try {
		const quiz = QuizSchema.parse(obj);
		return { ok: true, quiz };
	} catch (e) {
		return { ok: false, error: e as z.ZodError };
	}
}

export function deterministicRepair(obj: any): Quiz | null {
	try {
		if (!obj || typeof obj !== 'object') return null;
		const topic = typeof obj.topic === 'string' && obj.topic.trim() ? obj.topic.trim() : null;
		const rawQs = Array.isArray(obj.questions) ? obj.questions.slice(0, 5) : [];
		if (!topic) return null;
		if (rawQs.length !== 5) return null; // avoid fabricating questions for MVP
		const questions = rawQs.map((q: any, idx: number) => {
			const id = typeof q?.id === 'string' && q.id.trim() ? q.id : `q${idx + 1}`;
			const prompt = typeof q?.prompt === 'string' && q.prompt.trim() ? q.prompt.trim() : `Question ${idx + 1}`;
			let options: string[] = Array.isArray(q?.options) ? q.options.filter((o: any) => typeof o === 'string' && o.trim()).map((s: string) => s.trim()) : [];
			// dedupe while preserving order
			const seen = new Set<string>();
			options = options.filter((o) => (seen.has(o) ? false : (seen.add(o), true)));
			if (options.length > 4) options = options.slice(0, 4);
			while (options.length < 4) options.push(`Option ${String.fromCharCode(65 + options.length)}`);
			let correctIndex = Number.isInteger(q?.correctIndex) ? (q.correctIndex as number) : 0;
			correctIndex = clamp(correctIndex, 0, 3);
			return { id, prompt, options, correctIndex };
		});
		return { topic, questions };
	} catch {
		return null;
	}
}
