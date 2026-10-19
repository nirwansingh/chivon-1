import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

export function sendError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : 'Internal error';
  const status =
    error instanceof HttpError
      ? error.status
      : message === 'UNAUTHENTICATED'
        ? 401
        : message.startsWith('FORBIDDEN')
          ? 403
          : 400;
  res.status(status).json({
    error: message,
    details: error instanceof HttpError ? error.details : undefined,
  });
}
