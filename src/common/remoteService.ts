export type RemoteServiceResponseFormat = 'none' | 'json' | 'text';

export abstract class RemoteService {
  constructor(readonly baseUrl: string) {
  }

  protected getUrl(uri: string) {
    return new URL(uri, this.baseUrl);
  }

  protected async getRequestInit(requestInit: RequestInit = {}) {
    const headers = new Headers(requestInit.headers);
    if (!headers.has('Accept'))
      headers.append('Accept', 'application/json');
    if (!headers.has('Content-Type'))
      headers.append('Content-Type', 'application/json');

    requestInit.credentials = 'include';
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
    if (!response.ok)
      throw new Error(await response.text());

    return responseFormat === 'none'
      ? undefined :
      (await (responseFormat === 'json' ? (response.json() as any) : response.text()));
  }
}
