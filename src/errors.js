export class AppError extends Error {
  constructor(status, title, detail, type, errors = undefined) {
    super(detail);
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.type = type;
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(detail = 'Resource not found') {
    super(404, 'Not Found', detail, '/problems/not-found');
  }
}

export class ConflictError extends AppError {
  constructor(detail = 'Request conflicts with current state') {
    super(409, 'Conflict', detail, '/problems/conflict');
  }
}

export class ValidationError extends AppError {
  constructor(errors, detail = 'One or more fields failed validation') {
    super(422, 'Validation Failed', detail, '/problems/validation-failed', errors);
  }
}

export function formatProblem(err, requestId) {
  const body = {
    type: err.type || '/problems/internal-error',
    title: err.title || 'Internal Server Error',
    status: err.status || 500,
    detail: err.detail || 'Something went wrong',
    requestId,
  };

  if (err.errors) {
    body.errors = err.errors;
  }

  return body;
}
