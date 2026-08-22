import type { AnalyzeRequest, AnalyzeResponse, Health } from '../types'
import { apiFetch } from './client'

export function analyzeSolution(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  return apiFetch<AnalyzeResponse>('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function fetchHealth(): Promise<Health> {
  return apiFetch<Health>('/api/health')
}

export { ApiError, API_BASE } from './client'
