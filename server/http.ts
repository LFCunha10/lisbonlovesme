import { ZodError, type ZodSchema } from "zod";

export class AppError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function createAppError(status: number, message: string) {
  return new AppError(status, message);
}

export function parseWithSchema<T>(schema: ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw createAppError(400, result.error.issues[0]?.message ?? "Invalid request payload");
  }
  return result.data;
}

export function toErrorResponse(error: unknown, fallbackMessage = "Internal Server Error") {
  if (error instanceof AppError) {
    return { status: error.status, message: error.message };
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      message: error.issues[0]?.message ?? "Invalid request payload",
    };
  }

  if (error instanceof Error) {
    return { status: 500, message: error.message || fallbackMessage };
  }

  return { status: 500, message: fallbackMessage };
}
