import { Router } from 'express';
import path from 'path';
import { config } from '../config/index.js';
import { clearUnlockedApiKey, decryptSecret, getUnlockRemainingMs, getUnlockedApiKey, loadVault, setUnlockedApiKey } from '../services/crypto/vault.js';
import { badRequest, notFound, unauthorized } from '../errors/AppError.js';

export const unlockRouter = Router();

unlockRouter.post('/', (req, res) => {
	const password = String(req.body?.password || '');
	if (!password) throw badRequest('password is required');
	const vaultPath = path.join(process.cwd(), config.cacheDir, 'gemini.vault.json');
	const vault = loadVault(vaultPath);
	if (!vault) throw notFound('vault not found');
	try {
		const key = decryptSecret(vault, password);
		setUnlockedApiKey(key, config.unlockTtlMs);
		return res.json({ ok: true, ttlMs: config.unlockTtlMs });
	} catch {
		throw unauthorized('invalid password');
	}
});

unlockRouter.post('/lock', (_req, res) => {
	clearUnlockedApiKey();
	return res.json({ ok: true });
});

unlockRouter.get('/status', (_req, res) => {
	const present = !!getUnlockedApiKey();
	const ttlRemainingMs = present ? getUnlockRemainingMs() : 0;
	res.json({ unlocked: present, ttlRemainingMs });
});
