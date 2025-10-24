import fs from 'fs';
import path from 'path';
import { config } from '../../config/index.js';

export type LlmLogRecord = {
	timestamp: string;
	provider: 'gemini';
	model: string;
	topic: string;
	stage: 'initial' | 'repair';
	ok?: boolean;
	error?: string;
	text: string;
};

const fsp = fs.promises;

function redact(text: string): string {
	try {
		// naive redactions: keys and bearer tokens
		return text
			.replace(/("?api[_-]?key"?\s*:\s*")([^"]+)(")/gi, '$1[REDACTED]$3')
			.replace(/("?password"?\s*:\s*")([^"]+)(")/gi, '$1[REDACTED]$3')
			.replace(/(Authorization:\s*Bearer\s+)([A-Za-z0-9._-]+)/gi, '$1[REDACTED]');
	} catch { return text; }
}

async function rotateIfNeeded(filePath: string) {
	try {
		const stat = await fsp.stat(filePath);
		if (stat.size > config.logMaxBytes) {
			const backup = filePath + '.1';
			await fsp.rename(filePath, backup).catch(() => {});
		}
	} catch { /* ignore */ }
}

export async function appendGeminiLog(logDir: string, record: LlmLogRecord) {
	if (!config.llmLogging) return;
	try {
		await fsp.mkdir(logDir, { recursive: true });
		const filePath = path.join(logDir, 'gemini.log.ndjson');
		await rotateIfNeeded(filePath);
		const safe = { ...record, text: redact(record.text) };
		await fsp.appendFile(filePath, JSON.stringify(safe) + '\n', 'utf-8');
	} catch {
		// best-effort logging; ignore failures
	}
}
