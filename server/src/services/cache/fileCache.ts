import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import { type Quiz } from '../quiz/schema.js';

const fsp = fs.promises;

export type CacheKey = { topic: string; model: string; version: string };

async function ensureDir(dir: string) {
	await fsp.mkdir(dir, { recursive: true }).catch(() => {});
}

export function topicSlug(topic: string) {
	return slugify(topic, { lower: true, strict: true, trim: true });
}

export function cachePaths(baseDir: string, key: CacheKey) {
	const slug = topicSlug(key.topic);
	const fileBase = `${slug}_${key.model}_${key.version}`;
	const jsonPath = path.join(baseDir, `${fileBase}.json`);
	const rawPath = path.join(baseDir, `${fileBase}.raw.txt`);
	return { jsonPath, rawPath };
}

export async function readQuizFromCache(baseDir: string, key: CacheKey): Promise<Quiz | null> {
	try {
		const { jsonPath } = cachePaths(baseDir, key);
		await fsp.access(jsonPath, fs.constants.F_OK);
		const text = await fsp.readFile(jsonPath, 'utf-8');
		return JSON.parse(text) as Quiz;
	} catch {
		return null;
	}
}

export async function writeQuizToCache(baseDir: string, key: CacheKey, quiz: Quiz, rawText: string | null) {
	await ensureDir(baseDir);
	const { jsonPath, rawPath } = cachePaths(baseDir, key);
	await fsp.writeFile(jsonPath, JSON.stringify(quiz, null, 2), 'utf-8').catch(() => {});
	if (rawText) await fsp.writeFile(rawPath, rawText, 'utf-8').catch(() => {});
}
