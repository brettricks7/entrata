# Retrieval (Wikipedia) Plan

## Overview

Add retrieval-augmented generation using Wikipedia. When enabled, the server fetches a concise topic summary + URL and injects it into the prompt with a citation. Include `retrieval:on|off` and an optional `variant` in the cache key to allow different quiz variants to be generated and cached deterministically. Gracefully fall back if retrieval fails or times out.

## Backend

- Create `server/src/services/retrieval/wiki.ts` to fetch the top summary and canonical URL for a topic using Wikipedia APIs, with a short timeout and language support (default en). Return `{ title, extract, url } | null`.
- Config flags: `RETRIEVAL_ENABLED=true|false` (default false), `RETRIEVAL_TIMEOUT_MS` (e.g., 2500), `RETRIEVAL_LANG` (default `en`).
- Update `server/src/services/quiz/prompt.ts` to take an optional `context` string; when present, prepend a short “Facts (source: URL)” section.
- Update `server/src/routes/quiz.ts` to accept `retrieval?: boolean` and `variant?: string` in the POST body, gate retrieval by both the body flag and `RETRIEVAL_ENABLED`, and pass context to prompt. Add `retrieval:on|off` and `variant:<value>` to the constructed cache key string.
- Bump `CACHE_VERSION` to avoid mixing old/new schema keys.

## Frontend

- Add a “Use retrieval” checkbox and optional “Variant” text input in `web/src/App.tsx`; pass values to `/api/quiz`.

## API

- POST `/api/quiz` body: `{ topic: string, retrieval?: boolean, variant?: string }`
- 200 returns the normal quiz; retrieval simply influences generation.

## Notes

- Keep retrieval context very short (<700 chars) to avoid token bloat; elide if longer.
- On failure/timeout, proceed without context.