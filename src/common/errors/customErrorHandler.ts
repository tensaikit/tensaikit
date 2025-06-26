/**
 * Custom error handler for the application
 */

export class CustomError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "CustomError";
  }
}

export const handleError = (message: string, error: unknown): CustomError => {
  if (error instanceof CustomError) {
    return error;
  }

  if (error instanceof Error) {
    const fullMessage = `${message}: ${error.message}`;
    return new CustomError(fullMessage, "UNKNOWN_ERROR");
  }

  const fullMessage = `${message}: ${JSON.stringify(error)}`;
  return new CustomError(fullMessage, "UNKNOWN_ERROR");
};

export const createError = (message: string, code: string): CustomError => {
  return new CustomError(message, code);
};
