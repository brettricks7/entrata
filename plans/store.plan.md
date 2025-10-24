# Persistence & Review Plan

## Overview

Store quiz attempts (topic, score, total, answers, questionIds, timestamp) in Postgres via Prisma and expose simple endpoints to submit and list attempts. Add a lightweight review UI listing recent attempts and linking to a per-attempt view with answer breakdown.

## Backend

- Prisma
- Confirm `QuizAttempt` model; add `questionIds` (string[] or JSON) if not present
- Add migrations and ensure client initialization
- Routes
- POST `/api/attempts`: save `{ topic, score, total, answers, questionIds }`
- GET `/api/attempts?limit=20&topic=`: list recent attempts
- GET `/api/attempts/:id`: fetch one attempt for detailed review
- Service
- `services/attempts/service.ts`: encapsulate CRUD and validation
- Validation
- zod schemas for payloads; return 400 on invalid input

## Frontend

- On submit
- POST attempt from `Results` with the current quiz data
- Review list
- “Recent attempts” in `App` (or separate component): topic, score/total, createdAt; link to details
- Detail view
- Show the per-question correctness using stored `questionIds` + the original quiz if available in cache (fallback: store minimal question text snapshot in the attempt)

## API

- POST `/api/attempts`
- GET `/api/attempts?limit=20&topic=`
- GET `/api/attempts/:id`

## Notes

- Start minimal: store answers as JSON and an array of `questionIds`; optionally include a small snapshot of question prompts/options to avoid cache dependency.
- Add pagination later if needed.