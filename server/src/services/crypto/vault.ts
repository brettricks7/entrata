import fs from 'fs';
import path from 'path';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

export type VaultFile = {
	kdf: 'scrypt';
	salt: string; // base64
	N: number;
	r: number;
	p: number;
	iv: string; // base64 (12 bytes)
	ciphertext: string; // base64
	tag: string; // base64 (16 bytes)
	meta?: Record<string, unknown>;
};

const DEFAULT_SCRYPT = { N: 16384, r: 8, p: 1 };

export function encryptSecret(plaintext: string, password: string, params = DEFAULT_SCRYPT): VaultFile {
	const salt = randomBytes(16);
	const iv = randomBytes(12);
	const key = scryptSync(password, salt, 32, params);
	const cipher = createCipheriv('aes-256-gcm', key, iv);
	const enc = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
	const tag = cipher.getAuthTag();
	return {
		kdf: 'scrypt',
		salt: salt.toString('base64'),
		N: params.N,
		r: params.r,
		p: params.p,
		iv: iv.toString('base64'),
		ciphertext: enc.toString('base64'),
		tag: tag.toString('base64')
	};
}

export function decryptSecret(vault: VaultFile, password: string): string {
	const { salt, N, r, p, iv, ciphertext, tag } = vault;
	const key = scryptSync(password, Buffer.from(salt, 'base64'), 32, { N, r, p });
	const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
	decipher.setAuthTag(Buffer.from(tag, 'base64'));
	const dec = Buffer.concat([
		decipher.update(Buffer.from(ciphertext, 'base64')),
		decipher.final()
	]);
	return dec.toString('utf8');
}

export function loadVault(filePath: string): VaultFile | null {
	try {
		const text = fs.readFileSync(filePath, 'utf-8');
		return JSON.parse(text) as VaultFile;
	} catch {
		return null;
	}
}

export function saveVault(filePath: string, vault: VaultFile) {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(filePath, JSON.stringify(vault, null, 2), 'utf-8');
}

let unlockedKey: string | null = null;
let unlockedAt = 0;
let ttlMs = 0;

export function setUnlockedApiKey(key: string, ttl: number) {
	unlockedKey = key;
	unlockedAt = Date.now();
	ttlMs = Math.max(0, ttl);
}

export function getUnlockedApiKey(): string | null {
	if (!unlockedKey) return null;
	if (ttlMs > 0 && Date.now() - unlockedAt > ttlMs) {
		unlockedKey = null;
		unlockedAt = 0;
		ttlMs = 0;
		return null;
	}
	return unlockedKey;
}

export function getUnlockRemainingMs(): number {
	if (!unlockedKey) return 0;
	if (ttlMs <= 0) return 0;
	const elapsed = Date.now() - unlockedAt;
	const remaining = ttlMs - elapsed;
	if (remaining <= 0) {
		unlockedKey = null;
		unlockedAt = 0;
		ttlMs = 0;
		return 0;
	}
	return remaining;
}

export function clearUnlockedApiKey() {
	unlockedKey = null;
	unlockedAt = 0;
	ttlMs = 0;
}
