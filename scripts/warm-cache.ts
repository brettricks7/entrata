#!/usr/bin/env tsx
import 'dotenv/config';

const base = process.env.API_BASE || 'http://localhost:4000';
const topics = process.argv.slice(2);

if (topics.length === 0) {
	console.error('Usage: tsx scripts/warm-cache.ts "Photosynthesis" "Neural Networks"');
	process.exit(1);
}

(async () => {
	for (const topic of topics) {
		try {
			const res = await fetch(`${base}/api/quiz`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ topic })
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			console.log(`Cached: ${topic}`);
		} catch (e: any) {
			console.error(`Failed: ${topic} -> ${e?.message}`);
		}
	}
})();
