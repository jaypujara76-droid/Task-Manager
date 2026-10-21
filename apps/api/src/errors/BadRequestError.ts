import { AppError } from "./AppError.js";

export class BadRequestError extends AppError {
  errors?: unknown;

  constructor(message: string, errors?: unknown) {
    super(message, 400);

    this.name = "BadRequestError";
    this.errors = errors;
  }
}
