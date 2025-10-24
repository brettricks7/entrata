#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { encryptSecret, saveVault } from '../server/src/services/crypto/vault.js';

function getArg(name: string): string | undefined {
	const eqPrefix = `--${name}=`;
	for (let i = 0; i < process.argv.length; i++) {
		const a = process.argv[i];
		if (a.startsWith(eqPrefix)) return a.slice(eqPrefix.length);
		if (a === `--${name}`) return process.argv[i + 1];
	}
	return undefined;
}

async function prompt(query: string): Promise<string> {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => rl.question(query, (ans) => { rl.close(); resolve(ans); }));
}

(async () => {
	const argKey = getArg('key');
	const argPw = getArg('password');
	const key = argKey || process.env.GEMINI_API_KEY || (await prompt('Enter API key: '));
	if (!key) {
		console.error('API key required');
		process.exit(1);
	}
	const pw = argPw || process.env.GEMINI_VAULT_PASSWORD || (await prompt('Enter password to encrypt: '));
	if (!pw) {
		console.error('Password required');
		process.exit(1);
	}
	const vault = encryptSecret(key, pw);
	const outDir = process.env.CACHE_DIR || 'server/cache';
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
	const outPath = path.join(process.cwd(), outDir, 'gemini.vault.json');
	saveVault(outPath, vault);
	fs.chmodSync(outPath, 0o600);
	console.log(`Wrote vault: ${outPath}`);
})();
