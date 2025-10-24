export type Env = {
	geminiApiKey: string;
	allowNetwork: boolean;
	cacheDir: string;
	port: number;
	corsOrigin: string;
	model: string;
	cacheVersion: string;
	unlockTtlMs: number;
	logDir: string;
};

let cachedEnv: Env | null = null;
let warnedMissingKey = false;

export function getEnv(): Env {
	if (cachedEnv) return cachedEnv;

	const geminiApiKey = process.env.GEMINI_API_KEY || '';
	if (!geminiApiKey && !warnedMissingKey) {
		// eslint-disable-next-line no-console
		console.warn('GEMINI_API_KEY is not set. Your options are:');
		console.warn('1. Unlock via the web app with the password provided by Brett');
		console.warn('2. Set your own GEMINI_API_KEY in .env');
		console.warn('3. Use the vault unlock flow with the password provided by Brett');
		warnedMissingKey = true;
	}

	cachedEnv = {
		geminiApiKey,
		allowNetwork: (process.env.LLM_ALLOW_NETWORK ?? 'true').toLowerCase() === 'true',
		cacheDir: process.env.CACHE_DIR || 'cache',
		port: Number(process.env.PORT || 4000),
		corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
		model: process.env.LLM_MODEL || 'gemini-1.5-flash-001',
		cacheVersion: process.env.CACHE_VERSION || 'v1',
		unlockTtlMs: Number(process.env.LLM_UNLOCK_TTL_MS || 2 * 60 * 60 * 1000),
		logDir: process.env.LOG_DIR || 'logs'
	};
	return cachedEnv;
}
