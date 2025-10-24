export type Quiz = {
  topic: string;
  questions: Array<{
    id: string;
    prompt: string;
    options: [string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3;
  }>;
};

// Vite provides import.meta.env; add a light fallback and type guard for TS
const viteEnv: any = (import.meta as any)?.env || {};
const BASE = viteEnv.VITE_API_BASE || 'http://localhost:4000';

export async function generateQuiz(topic: string, offline = false): Promise<Quiz> {
  const res = await fetch(`${BASE}/api/quiz?offline=${offline ? 'true' : 'false'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getUnlockStatus(): Promise<{ unlocked: boolean; ttlRemainingMs: number }> {
  const res = await fetch(`${BASE}/api/unlock/status`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function unlock(password: string): Promise<void> {
  const res = await fetch(`${BASE}/api/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

export async function relock(): Promise<void> {
  const res = await fetch(`${BASE}/api/unlock/lock`, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
