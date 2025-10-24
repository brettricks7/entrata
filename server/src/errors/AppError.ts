export class AppError extends Error {
	status: number;
	code: string;
	details?: unknown;
	constructor(status: number, code: string, message: string, details?: unknown) {
		super(message);
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

export function badRequest(message: string, code = 'BAD_REQUEST', details?: unknown) {
	return new AppError(400, code, message, details);
}
export function unauthorized(message: string, code = 'UNAUTHORIZED', details?: unknown) {
	return new AppError(401, code, message, details);
}
export function notFound(message: string, code = 'NOT_FOUND', details?: unknown) {
	return new AppError(404, code, message, details);
}
export function unprocessable(message: string, code = 'UNPROCESSABLE_ENTITY', details?: unknown) {
	return new AppError(422, code, message, details);
}
export function internal(message: string, code = 'INTERNAL', details?: unknown) {
	return new AppError(500, code, message, details);
}
