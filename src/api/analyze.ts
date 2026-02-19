import type { AnalyzeRequest, AnalyzeResponse } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const ANALYZE_TIMEOUT_MS = 25_000

function getErrorMessage(data: unknown): string {
  if (typeof data === 'string') return data
  if (typeof data === 'object' && data !== null) {
    const maybeMessage = (data as { message?: unknown; error?: unknown }).message
    const maybeError = (data as { message?: unknown; error?: unknown }).error
    if (typeof maybeMessage === 'string') return maybeMessage
    if (typeof maybeError === 'string') return maybeError
  }
  return 'Request failed'
}

export async function analyzeSolution(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS)

  try {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const contentType = res.headers.get('content-type') || ''
    const data = contentType.includes('application/json')
      ? await res.json()
      : await res.text()

    if (!res.ok) {
      throw new Error(getErrorMessage(data))
    }

    return data as AnalyzeResponse
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
