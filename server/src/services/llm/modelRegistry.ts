import { GoogleGenerativeAI } from '@google/generative-ai';

const PREFERRED = [
	'gemini-2.5-flash',
	'gemini-flash-latest',
	'gemini-2.5-pro',
	'gemini-2.0-flash'
];

type CacheKey = string; // apiKey
const cache = new Map<CacheKey, string[]>();

export async function listSupportedModels(apiKey: string): Promise<string[]> {
	if (cache.has(apiKey)) return cache.get(apiKey)!;
	const genAI = new GoogleGenerativeAI(apiKey);
	const client: any = (genAI as any).models ?? undefined;
	// Fallback: the SDK has a REST fetch inside; use the SDK to list models if supported.
	const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
	if (!resp.ok) throw new Error(`ListModels failed: HTTP ${resp.status}`);
	const data = await resp.json();
	const names: string[] = (data.models || [])
		.filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
		.map((m: any) => String(m.name).replace(/^models\//, ''));
	cache.set(apiKey, names);
	return names;
}

export async function resolveModel(apiKey: string, desired: string): Promise<string> {
	const supported = await listSupportedModels(apiKey);
	if (supported.includes(desired)) return desired;
	for (const candidate of PREFERRED) {
		if (supported.includes(candidate)) return candidate;
	}
	if (supported.length > 0) return supported[0];
	throw new Error('No supported models for generateContent available for this API key');
}
