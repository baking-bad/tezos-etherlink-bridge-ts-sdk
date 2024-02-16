import { RemoteServiceResponseError } from './errors';
import { textUtils } from '../utils';

export type RemoteServiceResponseFormat = 'none' | 'json' | 'text';

export abstract class RemoteService {
  readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = textUtils.trimSlashes(baseUrl);
  }

  protected getUrl(uri: string) {
    return new URL(this.baseUrl + '/' + textUtils.trimSlashes(uri));
  }

  protected async getRequestInit(requestInit: RequestInit = {}) {
    const headers = new Headers(requestInit.headers);
    if (!headers.has('Accept'))
      headers.append('Accept', 'application/json');
    if (!headers.has('Content-Type'))
      headers.append('Content-Type', 'application/json');

    requestInit.headers = headers;
    return requestInit;
  }

  protected async fetch<T>(
    uriOrUrl: string | URL,
    responseFormat: T extends void ? 'none' : Exclude<RemoteServiceResponseFormat, 'none'>,
    requestInit?: RequestInit,
    useDefaultRequestInitFields = true
  ): Promise<T> {
    if (useDefaultRequestInitFields)
      requestInit = await this.getRequestInit(requestInit);

    const url = typeof uriOrUrl === 'string' ? this.getUrl(uriOrUrl) : uriOrUrl;
    const response = await fetch(url.href, requestInit);

    await this.ensureResponseOk(response);

    return responseFormat === 'none'
      ? undefined :
      (await (responseFormat === 'json' ? (response.json() as any) : response.text()));
  }

  protected async ensureResponseOk(response: Response) {
    if (response.ok)
      return;

    let content: string | undefined;
    try {
      content = await response.text();
    }
    catch {
      content = '[unavailable]';
    }

    throw new RemoteServiceResponseError(response.status, content);
  }
}
