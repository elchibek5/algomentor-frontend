const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

const TIMEOUT_MS = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? 25_000)

/** An error the UI can explain to the user, rather than a raw fetch failure. */
export class ApiError extends Error {
  readonly kind: 'offline' | 'timeout' | 'server'
  readonly hint?: string

  constructor(message: string, kind: 'offline' | 'timeout' | 'server', hint?: string) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.hint = hint
  }
}

function messageFrom(data: unknown, fallback: string): string {
  if (typeof data === 'string' && data.trim()) return data
  if (typeof data === 'object' && data !== null) {
    const { message, error } = data as { message?: unknown; error?: unknown }
    if (typeof message === 'string' && message.trim()) return message
    if (typeof error === 'string' && error.trim()) return error
  }
  return fallback
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        'The request timed out.',
        'timeout',
        'The model may be slow right now. Try again in a moment.',
      )
    }
    // fetch only rejects like this when the request never reached a server.
    throw new ApiError(
      `Cannot reach the backend at ${API_BASE}.`,
      'offline',
      'Start it with `./scripts/dev.sh` in the algomentor-backend folder, then retry.',
    )
  } finally {
    clearTimeout(timeoutId)
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await res.json() : await res.text()

  if (!res.ok) {
    throw new ApiError(messageFrom(data, `Request failed (HTTP ${res.status}).`), 'server')
  }

  return data as T
}

export { API_BASE }
