import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import { config } from '../config/index.js';

// To keep stack traces out of production
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
	const isAppError = err instanceof AppError;
	const status = isAppError ? err.status : (typeof err?.status === 'number' ? err.status : 500);
	const code = isAppError ? err.code : 'INTERNAL';
	const message = typeof err?.message === 'string' ? err.message : 'Internal Server Error';
	const body: any = { error: { code, message } };
	if (isAppError && err.details) body.details = err.details;
	if (config.nodeEnv === 'development' && err?.stack) body.stack = String(err.stack);
	res.status(status).json(body);
}
