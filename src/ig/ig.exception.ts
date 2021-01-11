export class IgException<T = any> extends Error {
  constructor(public detail: T) {
    super(JSON.stringify(detail));
  }
}
