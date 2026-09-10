import { Request, Response, NextFunction } from "express";

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err);

  const error = err as HttpError;
  const status = error.statusCode ?? error.status ?? 500;
  const message = error.message || "Internal server error";

  res.status(status).json({
    success: false,
    message,
  });
};
