export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const REQUEST_TIMEOUT_MS = 15000;
const GET_RETRY_COUNT = 1;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function apiRequest<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const method = (init?.method ?? 'GET').toUpperCase();
  const maxAttempts = method === 'GET' ? GET_RETRY_COUNT + 1 : 1;
  let response: Response | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = init?.signal ? null : new AbortController();
    const timeout = controller
      ? window.setTimeout(() => {
          controller.abort();
        }, REQUEST_TIMEOUT_MS)
      : null;

    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers,
        signal: init?.signal ?? controller?.signal,
      });
    } catch (error) {
      if (timeout) window.clearTimeout(timeout);
      const retryable = method === 'GET' && attempt < maxAttempts;
      if (retryable) {
        await wait(450 * attempt);
        continue;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.');
      }
      throw error;
    }

    if (timeout) window.clearTimeout(timeout);

    if (response.ok) {
      break;
    }

    const retryableStatus = response.status === 502 || response.status === 503 || response.status === 504;
    if (method === 'GET' && retryableStatus && attempt < maxAttempts) {
      await wait(450 * attempt);
      continue;
    }
    break;
  }

  if (!response) {
    throw new Error('요청 처리 중 오류가 발생했습니다.');
  }

  if (!response.ok) {
    let message = '요청 처리 중 오류가 발생했습니다.';
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
