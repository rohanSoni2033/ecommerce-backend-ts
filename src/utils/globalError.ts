class GlobalError {
  statusCode: number;
  error: { field?: string; message: string }[] | string;

  constructor(
    statusCode: number,
    error: { field?: string; message: string }[] | string
  ) {
    this.statusCode = statusCode;
    this.error = error;

    Error.captureStackTrace(this);
  }
}

export default GlobalError;
