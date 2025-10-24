import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildQuizPrompt } from '../quiz/prompt.js';
import { deterministicRepair, tryValidateQuiz } from '../quiz/parse.js';
import { type Quiz } from '../quiz/schema.js';
import { getUnlockedApiKey } from '../crypto/vault.js';
import { config } from '../../config/index.js';
import { appendGeminiLog } from '../logger/llmLogger.js';
import { resolveModel } from './modelRegistry.js';

export type GenerateParams = {
	apiKey?: string;
	model?: string;
	topic: string;
};

export async function generateQuizViaGemini(params: GenerateParams): Promise<{ quiz: Quiz; raw: string }>
{
	const apiKey = getUnlockedApiKey() || params.apiKey || config.geminiApiKey;
	const desired = params.model || config.model;
	const modelName = await resolveModel(apiKey, desired);
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({
		model: modelName,
		generationConfig: { responseMimeType: 'application/json' }
	});
	const prompt = buildQuizPrompt(params.topic);
	const result = await model.generateContent(prompt);
	const raw = result.response.text();
	await appendGeminiLog(config.logDir, {
		timestamp: new Date().toISOString(),
		provider: 'gemini',
		model: modelName,
		topic: params.topic,
		stage: 'initial',
		ok: true,
		text: raw
	});
	let parsed: any;
	try {
		parsed = JSON.parse(raw);
	} catch {
		const match = raw.match(/\{[\s\S]*\}/);
		parsed = match ? JSON.parse(match[0]) : null;
	}
	if (parsed) {
		const v = tryValidateQuiz(parsed);
		if (v.ok) return { quiz: v.quiz, raw };
		const repaired = deterministicRepair(parsed);
		if (repaired) return { quiz: repaired, raw };
	}
	const repairPrompt = [
		'Fix the following JSON to conform exactly to the schema. Output only the corrected JSON with no commentary.',
		'Ensure 5 questions, each with 4 options and correctIndex 0..3.',
		'JSON to fix:',
		'```json',
		JSON.stringify(parsed ?? raw, null, 2),
		'```'
	].join('\n');
	const repairRes = await model.generateContent(repairPrompt);
	const repairedRaw = repairRes.response.text();
	await appendGeminiLog(config.logDir, {
		timestamp: new Date().toISOString(),
		provider: 'gemini',
		model: modelName,
		topic: params.topic,
		stage: 'repair',
		ok: true,
		text: repairedRaw
	});
	const repairedObj = JSON.parse(repairedRaw);
	const repairedV = tryValidateQuiz(repairedObj);
	if (repairedV.ok) return { quiz: repairedV.quiz, raw: repairedRaw };
	const final = deterministicRepair(repairedObj);
	if (final) return { quiz: final, raw: repairedRaw };
	throw Object.assign(new Error('Could not repair model output to valid quiz'), { status: 422, details: null });
}
