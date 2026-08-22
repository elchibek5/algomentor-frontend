import { useEffect, useState } from 'react'
import { fetchHealth, ApiError, API_BASE } from '../api/analyze'
import type { Health } from '../types'

type Status =
  | { state: 'checking' }
  | { state: 'offline'; hint: string }
  | { state: 'ready'; health: Health }

/**
 * Tells the user up front whether the backend is reachable and whether analyses are real.
 * Without this, demo output is indistinguishable from a genuine review.
 */
export default function StatusBanner() {
  const [status, setStatus] = useState<Status>({ state: 'checking' })
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchHealth()
      .then((health) => {
        if (!cancelled) setStatus({ state: 'ready', health })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const hint =
          error instanceof ApiError && error.hint
            ? error.hint
            : 'Start the backend, then reload this page.'
        setStatus({ state: 'offline', hint })
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (status.state === 'checking') return null

  if (status.state === 'offline') {
    return (
      <Banner tone="danger">
        <strong>Backend not reachable</strong> at <code className="font-mono">{API_BASE}</code>.{' '}
        {status.hint}
      </Banner>
    )
  }

  if (status.health.mode === 'live' || dismissed) return null

  return (
    <Banner tone="warning" onDismiss={() => setDismissed(true)}>
      <strong>Demo mode.</strong> Analyses are generated offline from simple pattern matching,
      not by a language model. Add <code className="font-mono">OPENAI_API_KEY</code> to{' '}
      <code className="font-mono">.env.local</code> in the backend folder and restart it for real
      analysis.
    </Banner>
  )
}

const tones = {
  warning: 'border-amber-400/40 bg-amber-500/10 text-amber-100',
  danger: 'border-rose-400/40 bg-rose-500/10 text-rose-100',
} as const

function Banner(props: {
  tone: keyof typeof tones
  children: React.ReactNode
  onDismiss?: () => void
}) {
  return (
    <div
      role="status"
      className={`mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${tones[props.tone]}`}
    >
      <div className="flex-1">{props.children}</div>
      {props.onDismiss && (
        <button
          onClick={props.onDismiss}
          aria-label="Dismiss"
          className="rounded-lg px-2 py-0.5 text-lg leading-none opacity-70 transition hover:opacity-100"
        >
          &times;
        </button>
      )}
    </div>
  )
}
