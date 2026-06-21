import { Request, NextFunction } from "express";
import { Response } from "./authMiddleware";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error("Error:", err);

  // Operational, trusted error: send message to client
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // Programming or unknown error: don't leak error details
  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }

  // Development: send full error details
  return res.status(500).json({
    status: "error",
    message: err.message,
    stack: err.stack,
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
