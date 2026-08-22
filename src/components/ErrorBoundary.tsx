import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true)
      setError(event.error)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true)
      setError(new Error(String(event.reason)))
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-rose-950/30 p-6">
          <h1 className="text-xl font-bold text-rose-300">Something went wrong</h1>
          <p className="mt-2 text-sm text-rose-200">{error?.message || 'An unexpected error occurred'}</p>
          <button
            onClick={() => {
              setHasError(false)
              setError(null)
              window.location.reload()
            }}
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium hover:bg-rose-700"
          >
            Reload page
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
