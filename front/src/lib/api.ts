export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const REQUEST_TIMEOUT_MS = 15000;

export async function apiRequest<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = init?.signal ? null : new AbortController();
  const timeout = controller
    ? window.setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT_MS)
    : null;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: init?.signal ?? controller?.signal,
    });
  } catch (error) {
    if (timeout) window.clearTimeout(timeout);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.');
    }
    throw error;
  }
  if (timeout) window.clearTimeout(timeout);

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
