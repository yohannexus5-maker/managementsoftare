import type { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function notFound(message = "Not found"): HttpError {
  return new HttpError(404, message);
}

export function forbidden(message = "Forbidden"): HttpError {
  return new HttpError(403, message);
}

export function badRequest(message = "Bad request"): HttpError {
  return new HttpError(400, message);
}

export function unauthorized(message = "Unauthorized"): HttpError {
  return new HttpError(401, message);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err && typeof err === "object" && "issues" in err) {
    // zod error
    return res.status(400).json({ error: "Validation failed", details: (err as any).issues });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
