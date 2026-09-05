export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown> | string[];

  constructor(
    code: string,
    message: string,
    status: number = 400,
    details?: Record<string, unknown> | string[],
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const APIError = ApiError;
