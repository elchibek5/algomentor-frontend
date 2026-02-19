import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzeSolution } from '../api/analyze'
import type { AnalyzeResponse, AnalyzeMode } from '../types'

const LANGUAGE_OPTIONS = [
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'javascript', label: 'JavaScript' },
] as const

const MODE_OPTIONS: { value: AnalyzeMode; label: string; description: string; vibe: string }[] = [
  {
    value: 'interview',
    label: 'Interview',
    description: 'Clear, practical feedback for communicating your thought process.',
    vibe: 'Most balanced choice for mock interview prep.',
  },
  {
    value: 'simple',
    label: 'Simple',
    description: 'Fast and lightweight notes when you just want the highlights.',
    vibe: 'Perfect for last-minute revision before class.',
  },
  {
    value: 'deep',
    label: 'Deep',
    description: 'Detailed pass over correctness, complexity, and test quality.',
    vibe: 'Best when you have time to sharpen every detail.',
  },
]

const QUICK_STARTS = [
  {
    title: 'LeetCode Warm-up',
    problem: 'Valid Parentheses',
    constraints: '1 <= s.length <= 1e4',
    language: 'javascript',
    solution: `function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' }
  const stack = []

  for (const ch of s) {
    if (!pairs[ch]) {
      stack.push(ch)
      continue
    }
    if (stack.pop() !== pairs[ch]) {
      return false
    }
  }

  return stack.length === 0
}`,
  },
  {
    title: 'Greedy Practice',
    problem: 'Best Time to Buy and Sell Stock',
    constraints: '1 <= prices.length <= 1e5',
    language: 'python',
    solution: `def maxProfit(prices):
    min_price = float('inf')
    best = 0

    for price in prices:
        min_price = min(min_price, price)
        best = max(best, price - min_price)

    return best`,
  },
] as const

export default function AnalyzePage() {
  const [language, setLanguage] = useState('java')
  const [mode, setMode] = useState<AnalyzeMode>('interview')
  const [problem, setProblem] = useState('')
  const [constraints, setConstraints] = useState('')
  const [solution, setSolution] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resultsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (result) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  const selectedMode = useMemo(
    () => MODE_OPTIONS.find((option) => option.value === mode),
    [mode]
  )

  function fillExample() {
    setLanguage('java')
    setMode('interview')
    setProblem('Two Sum')
    setConstraints('2 <= n <= 1e5, exactly one valid pair')
    setSolution(`class Solution {
  public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();

    for (int i = 0; i < nums.length; i++) {
      int complement = target - nums[i];
      if (seen.containsKey(complement)) {
        return new int[] {seen.get(complement), i};
      }
      seen.put(nums[i], i);
    }

    return new int[] {-1, -1};
  }
}`)
    setError(null)
  }

  function clearForm() {
    setProblem('')
    setConstraints('')
    setSolution('')
    setResult(null)
    setError(null)
  }

  function loadQuickStart(index: number) {
    const quick = QUICK_STARTS[index]
    if (!quick) return

    setProblem(quick.problem)
    setConstraints(quick.constraints)
    setLanguage(quick.language)
    setSolution(quick.solution)
    setError(null)
  }

  async function onAnalyze() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await analyzeSolution({
        language,
        mode,
        problem: problem || undefined,
        constraints: constraints || undefined,
        solution,
      })
      setResult(data)
    } catch (caughtError: unknown) {
      if (caughtError instanceof Error) {
        setError(caughtError.message)
      } else {
        setError('Request failed')
      }
    } finally {
      setLoading(false)
    }
  }

  async function copyResultJson() {
    if (!result) {
      return
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    } catch {
      setError('Unable to copy JSON. Please check browser clipboard permissions.')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="floating-blob floating-blob-one" aria-hidden />
      <div className="floating-blob floating-blob-two" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <header className="glass-panel mb-6 flex flex-wrap items-center justify-between gap-4 p-6 md:p-8">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-violet-300">AlgoMentor Studio</p>
            <h1 className="text-3xl font-semibold md:text-4xl">Make your solution look interview-ready</h1>
            <p className="mt-2 max-w-2xl text-slate-300">
              Drop your code, pick a mode, and get clean structured feedback you can actually study from.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={fillExample} className="btn-secondary">
              Load sample
            </button>
            <button onClick={clearForm} className="btn-secondary">
              Reset
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-6 lg:grid-cols-[1.65fr_1fr]">
          <div className="glass-panel p-5 md:p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              {QUICK_STARTS.map((quick, index) => (
                <button key={quick.title} className="chip-btn" onClick={() => loadQuickStart(index)}>
                  {quick.title}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Language" htmlFor="language">
                <select
                  id="language"
                  className="input-base"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Mode" htmlFor="mode">
                <select
                  id="mode"
                  className="input-base"
                  value={mode}
                  onChange={(event) => setMode(event.target.value as AnalyzeMode)}
                >
                  {MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Problem (optional)" htmlFor="problem">
                <input
                  id="problem"
                  className="input-base"
                  value={problem}
                  onChange={(event) => setProblem(event.target.value)}
                  placeholder="e.g. Two Sum"
                />
              </Field>
              <Field label="Constraints (optional)" htmlFor="constraints">
                <input
                  id="constraints"
                  className="input-base"
                  value={constraints}
                  onChange={(event) => setConstraints(event.target.value)}
                  placeholder="e.g. n up to 1e5"
                />
              </Field>
            </div>

            <Field label="Solution" htmlFor="solution" className="mt-4">
              <textarea
                id="solution"
                className="input-base h-64 font-mono text-sm leading-relaxed"
                value={solution}
                onChange={(event) => setSolution(event.target.value)}
                placeholder="Paste your code here..."
              />
            </Field>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={onAnalyze}
                disabled={loading || solution.trim().length === 0}
                className="btn-primary"
              >
                {loading ? 'Analyzing...' : 'Analyze solution'}
              </button>
              {loading && <p className="text-sm text-violet-200">Crunching through your logic...</p>}
              {error && <p className="text-sm font-medium text-rose-300">{error}</p>}
            </div>
          </div>

          <aside className="glass-panel p-5 md:p-6">
            <h2 className="text-lg font-semibold text-violet-200">Current mode</h2>
            <p className="mt-2 text-xl font-semibold">{selectedMode?.label}</p>
            <p className="mt-2 text-slate-300">{selectedMode?.description}</p>
            <p className="mt-3 rounded-lg border border-violet-300/20 bg-violet-500/10 px-3 py-2 text-sm text-violet-100">
              {selectedMode?.vibe}
            </p>

            <div className="mt-5 space-y-2 text-sm text-slate-300">
              <p>✅ Best input: include problem + constraints when possible.</p>
              <p>✅ Real code beats pseudocode for better complexity checks.</p>
              <p>✅ Compare two modes quickly by clicking Reset and re-running.</p>
            </div>
          </aside>
        </section>

        {!result && !loading && (
          <section className="glass-panel p-5 text-slate-300">
            <h2 className="text-lg font-semibold text-violet-100">No feedback yet</h2>
            <p className="mt-2 text-sm">
              Paste your solution and hit <span className="font-semibold text-slate-100">Analyze solution</span> to
              generate a full breakdown.
            </p>
          </section>
        )}

        {loading && (
          <section className="glass-panel p-5">
            <div className="loading-line" />
            <div className="loading-line mt-3 w-2/3" />
            <div className="loading-line mt-3 w-5/6" />
          </section>
        )}

        {result && (
          <section ref={resultsRef} className="space-y-4 animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-violet-100">Feedback board</h2>
              <button onClick={copyResultJson} className="btn-secondary">
                Copy JSON
              </button>
            </div>

            <ResultSection title="Summary">
              <ul className="list-disc space-y-1 pl-5 text-slate-200">
                {result.summary.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </ResultSection>

            <ResultSection title="Correctness">
              <div className="space-y-2 text-slate-200">
                <p>
                  <span className="font-semibold text-violet-200">Intuition:</span> {result.correctness.intuition}
                </p>
                <div>
                  <p className="font-semibold text-violet-200">Invariants:</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {result.correctness.invariants.map((invariant, index) => (
                      <li key={index}>{invariant}</li>
                    ))}
                  </ul>
                </div>
                <p>
                  <span className="font-semibold text-violet-200">Proof sketch:</span>{' '}
                  {result.correctness.proofSketch}
                </p>
              </div>
            </ResultSection>

            <ResultSection title="Complexity">
              <div className="grid gap-3 md:grid-cols-2">
                <StatCard label="Time" value={result.complexity.time} />
                <StatCard label="Space" value={result.complexity.space} />
              </div>
              <p className="mt-3 text-slate-200">{result.complexity.explanation}</p>
            </ResultSection>

            <ResultSection title="Edge cases">
              <div className="grid gap-3 md:grid-cols-2">
                {result.edgeCases.map((edgeCase, index) => (
                  <article key={index} className="rounded-lg border border-white/15 bg-slate-900/60 p-3">
                    <h3 className="font-semibold text-violet-200">{edgeCase.case}</h3>
                    <p className="mt-1 text-slate-300">{edgeCase.why}</p>
                  </article>
                ))}
              </div>
            </ResultSection>

            <ResultSection title="Pitfalls">
              <ul className="list-disc space-y-1 pl-5 text-slate-200">
                {result.pitfalls.map((pitfall, index) => (
                  <li key={index}>{pitfall}</li>
                ))}
              </ul>
            </ResultSection>

            <ResultSection title="Tests">
              <div className="overflow-auto rounded-lg border border-white/10">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-900/80 text-slate-200">
                    <tr>
                      <th className="p-2">Input</th>
                      <th className="p-2">Expected</th>
                      <th className="p-2">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.tests.map((test, index) => (
                      <tr key={index} className="border-t border-white/10 text-slate-300">
                        <td className="p-2 font-mono">{test.input}</td>
                        <td className="p-2 font-mono">{test.expected}</td>
                        <td className="p-2">{test.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ResultSection>

            <ResultSection title="Improvements">
              <ul className="list-disc space-y-1 pl-5 text-slate-200">
                {result.improvements.map((improvement, index) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </ResultSection>
          </section>
        )}
      </div>
    </div>
  )
}

function Field(props: {
  label: string
  htmlFor: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={props.className}>
      <label htmlFor={props.htmlFor} className="text-sm font-medium text-slate-300">
        {props.label}
      </label>
      <div className="mt-1">{props.children}</div>
    </div>
  )
}

function ResultSection(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-panel p-4 md:p-5">
      <h3 className="mb-3 text-lg font-semibold text-violet-100">{props.title}</h3>
      {props.children}
    </section>
  )
}

function StatCard(props: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-slate-900/60 p-3">
      <p className="text-xs uppercase tracking-wider text-slate-400">{props.label}</p>
      <p className="mt-1 text-xl font-semibold text-violet-100">{props.value}</p>
    </div>
  )
}
