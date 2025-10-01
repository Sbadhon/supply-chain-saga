export function asProblem(status, title, detail, errors) {
  return { type: 'about:blank', title, status, detail, errors };
}

export class HttpError extends Error {
  constructor(status, detail, extras = {}) {
    super(detail);
    this.status = status;
    this.detail = detail;
    Object.assign(this, extras);
  }
}
