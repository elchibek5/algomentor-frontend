import type { AnalyzeRequest, AnalyzeResponse } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export async function analyzeSolution(
  payload: AnalyzeRequest
): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await res.json()
    : await res.text()

  if (!res.ok) {
    const message =
      typeof data === 'string'
        ? data
        : data?.message || data?.error || 'Request failed'
    throw new Error(message)
  }

  return data as AnalyzeResponse
}
