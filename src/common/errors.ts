export abstract class TokenBridgeError extends Error {
  readonly name: string;

  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);

    this.name = this.constructor.name;
  }
}

export class DisposedError extends TokenBridgeError {
}

export class RemoteServiceResponseError extends TokenBridgeError {
  constructor(status: Response['status'], content: string) {
    super(RemoteServiceResponseError.getMessage(status, content));
  }

  protected static getMessage(status: Response['status'], content: string): string {
    return `Response Error [Code: ${status}]. Content = ${content}`;
  }
}
