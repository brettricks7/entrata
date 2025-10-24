import { Router } from 'express';
import { config } from '../config/index.js';
import { readQuizFromCache, writeQuizToCache, type CacheKey } from '../services/cache/fileCache.js';
import { generateQuizViaGemini } from '../services/llm/gemini.js';
import { tryValidateQuiz } from '../services/quiz/parse.js';
import { getUnlockedApiKey } from '../services/crypto/vault.js';
import { badRequest, notFound, unprocessable } from '../errors/AppError.js';

export const quizRouter = Router();

quizRouter.post('/', async (req, res, next) => {
	try {
		const topic = String(req.body?.topic || '').trim();
		const unlocked = !!getUnlockedApiKey();
		const haveEnvKey = !!config.geminiApiKey;
		const haveKey = unlocked || haveEnvKey;
		const offlineFlag = String(req.query.offline || '').toLowerCase() === 'true';
		const allowNetwork = config.allowNetwork;
		const offline = offlineFlag || !allowNetwork || !haveKey;
		if (!topic) {
			throw badRequest('topic is required');
		}
		const key: CacheKey = { topic, model: config.model, version: config.cacheVersion };
		const cached = await readQuizFromCache(config.cacheDir, key);
		if (cached) {
			return res.json(cached);
		}
		if (offline) {
			const reasons: string[] = [];
			if (offlineFlag) reasons.push('offline=true');
			if (!allowNetwork) reasons.push('LLM_ALLOW_NETWORK=false');
			if (!haveKey) reasons.push('noUnlockedKeyAndNoEnvKey');
			throw notFound('Cache miss in offline mode', 'CACHE_MISS_OFFLINE', { reasons, debug: { unlocked, haveEnvKey, allowNetwork } });
		}
		const { quiz, raw } = await generateQuizViaGemini({ topic });
		const v = tryValidateQuiz(quiz);
		if (!v.ok) {
			throw unprocessable('Generated quiz failed validation', 'QUIZ_VALIDATION_FAILED', v.error.flatten());
		}
		await writeQuizToCache(config.cacheDir, key, quiz, raw);
		return res.json(quiz);
	} catch (err) {
		next(err);
	}
});
