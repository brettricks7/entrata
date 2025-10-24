import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

function tryLoadEnv(envPath: string): boolean {
	if (fs.existsSync(envPath)) {
		dotenv.config({ path: envPath });
		return true;
	}
	return false;
}

// Attempt to load env in priority order:
// 1) ENV_FILE (explicit path)
// 2) server/.env (cwd)
// 3) repo/.env (parent)
// 4) server/.env.example
// 5) repo/.env.example
export function loadEnvWithFallback() {
	const cwd = process.cwd(); // usually .../server
	const explicit = process.env.ENV_FILE || '';
	const candidates = [
		explicit,
		path.join(cwd, '.env'),
		path.join(cwd, '..', '.env'),
		path.join(cwd, '.env.example'),
		path.join(cwd, '..', '.env.example')
	].filter(Boolean) as string[];
	for (const p of candidates) {
		if (p && tryLoadEnv(p)) {
			return p;
		}
	}
	return '';
}
