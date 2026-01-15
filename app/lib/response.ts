/**
 * JSON response helper for React Router
 * Creates a Response object with JSON content type
 */
export function json<T = unknown>(data: T, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}
