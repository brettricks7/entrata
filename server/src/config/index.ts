import path from 'path';
import { loadEnvWithFallback } from './loadEnv.js';

export type AppConfig = {
	port: number;
	corsOrigin: string;
	cacheDir: string; // relative to server cwd
	logDir: string; // relative to server cwd
	geminiApiKey: string;
	allowNetwork: boolean;
	model: string;
	cacheVersion: string;
	unlockTtlMs: number;
	llmLogging: boolean;
	logMaxBytes: number;
	nodeEnv: string;
};

function buildConfig(): AppConfig {
	loadEnvWithFallback();
	const nodeEnv = process.env.NODE_ENV || 'development';
	const port = Number(process.env.PORT || 4000);
	const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
	// Directories remain relative to server cwd for dev ergonomics
	const cacheDir = process.env.CACHE_DIR || 'cache';
	const logDir = process.env.LOG_DIR || 'logs';
	const geminiApiKey = process.env.GEMINI_API_KEY || '';
	const allowNetwork = (process.env.LLM_ALLOW_NETWORK ?? 'true').toLowerCase() === 'true';
	const model = process.env.LLM_MODEL || 'gemini-2.5-flash';
	const cacheVersion = process.env.CACHE_VERSION || 'v1';
	const unlockTtlMs = Number(process.env.LLM_UNLOCK_TTL_MS || 2 * 60 * 60 * 1000);
	const llmLogging = (process.env.LLM_LOGGING ?? 'true').toLowerCase() === 'true';
	const logMaxBytes = Number(process.env.LOG_MAX_BYTES || 10_000_000);
	return {
		port,
		corsOrigin,
		cacheDir,
		logDir,
		geminiApiKey,
		allowNetwork,
		model,
		cacheVersion,
		unlockTtlMs,
		llmLogging,
		logMaxBytes,
		nodeEnv
	};
}

export const config: Readonly<AppConfig> = Object.freeze(buildConfig());
