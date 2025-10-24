# AI-Powered Quiz Builder (Gemini + Express + React)

A single-page React/TypeScript app backed by an Express/TypeScript API that generates 5-question multiple-choice quizzes via Google Gemini. Results are cached to filesystem to avoid rate limits. Includes a password-locked vault for your API key with a 2-hour TTL auto-expiry.

## Prerequisites

- Node.js 20+
- npm (or pnpm/yarn if you prefer)

## Environment

Create `.env` at repo root (see `.env.example`). Common vars:

```
GEMINI_API_KEY=           # optional if you plan to use the vault unlock flow only
LLM_ALLOW_NETWORK=true    # set false to force offline/cache-only
LLM_MODEL=gemini-2.5-flash # choose a supported model from ListModels output
PORT=4000                 # server port
CACHE_DIR=server/cache    # where cache and vault live (or 'cache' if running server from server/)
CORS_ORIGIN=http://localhost:5173
CACHE_VERSION=v1
LLM_UNLOCK_TTL_MS=7200000 # 2 hours TTL for unlocked in-memory API key
LLM_LOGGING=true          # enable/disable raw LLM response logging (ndjson)
LOG_MAX_BYTES=10000000    # naive rotation threshold for gemini.log.ndjson
```

Tip: use Google ListModels to see supported model IDs (plain IDs, not `models/...`). For example: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-flash-latest`.

## Install & Run (Dev)

- Server

```
cd server
npm install
npm run dev
```

- Web

```
cd web
npm install
npm run dev
```

Open the web app at `http://localhost:5173`.

## Using the Password-Locked API Key Vault

You can store your Gemini API key encrypted on disk and unlock it at runtime with a password.

1) Create the encrypted vault (writes `server/cache/gemini.vault.json`):

- Non-interactive (recommended):

```
npx --yes tsx scripts/make-vault.ts --key "$GEMINI_API_KEY" --password "your_pw"
```

- Interactive:

```
npx --yes tsx scripts/make-vault.ts
```

2) Unlock/Lock at runtime (TTL default 2 hours):

- From the SPA:
  - Click Generate → if locked, the UI will prompt for a password and unlock, then proceed.
  - Click the Lock button to relock at any time.
- Via HTTP:

```
# Unlock
curl -X POST http://localhost:4000/api/unlock \
  -H 'Content-Type: application/json' \
  -d '{"password":"your_pw"}'

# Check status (includes TTL remaining)
curl http://localhost:4000/api/unlock/status
# -> { "unlocked": true|false, "ttlRemainingMs": number }

# Lock
curl -X POST http://localhost:4000/api/unlock/lock
```

After TTL expiry (default 2 hours), the key is cleared from memory. Set `LLM_UNLOCK_TTL_MS` to adjust.

## API

- Generate a quiz (uses cache when available):

```
POST http://localhost:4000/api/quiz?offline=false
Content-Type: application/json

{ "topic": "Photosynthesis" }
```

Responses:

- 200: Quiz JSON (5 questions, each 4 options, one correctIndex)
- 404: Cache miss while offline (no network+no unlocked/env key). The response includes debug reasons.
- 422: Model output could not be repaired to valid quiz

### Caching Behavior

- Cache key: `<slug(topic)>_<model>_<version>.json` under `server/cache/`
- If cache exists, it is returned without calling the model
- If offline (flag or env) and cache is missing: 404 (with `reasons`)

## Warm Cache (Optional)

Pre-generate and cache topics for demos:

```
npx --yes tsx scripts/warm-cache.ts "Photosynthesis" "Neural Networks" "Ancient Rome"
```

## Logging (LLM Raw Responses)

- Raw Gemini responses (initial and repair) are appended to NDJSON at `server/logs/gemini.log.ndjson`.
- Configure with `LOG_DIR` and `LLM_LOGGING`. Naive size-based rotation controlled by `LOG_MAX_BYTES`.

## Troubleshooting

- tsx not found:
  - Use `npx --yes tsx ...` from repo root, or `cd server && npm install && npx tsx ...`
- Missing packages / type errors:
  - Run `npm install` in both `server/` and `web/`
- 404 cache miss in offline mode:
  - Unlock your vault (or set `GEMINI_API_KEY`) and retry with `offline=false`, or warm the cache first. The 404 body includes `reasons` and `debug`.
- CORS issues:
  - Adjust `CORS_ORIGIN` in `.env`
- Model 404/unsupported:
  - The backend now auto-resolves a supported model from ListModels; set `LLM_MODEL` to prefer a specific model.

## Notes

- The backend enforces a strict JSON schema with validation and deterministic repair for model outputs.
- Filesystem cache is simple and effective for local demos; not intended for horizontal scale.
- Optional Prisma schema is included for future persistence; not used by the MVP.
