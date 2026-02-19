import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { analyzeSolution } from '../api/analyze'
import type { AnalyzeResponse } from '../types'

const DRAFT_KEY = 'algomentor-analyze-draft-v1'
const MIN_SOLUTION_LENGTH = 20

type Mode = 'interview' | 'simple' | 'deep'

type AnalyzeDraft = {
  language: string
  mode: Mode
  problem: string
  constraints: string
  solution: string
}

const defaultDraft: AnalyzeDraft = {
  language: 'java',
  mode: 'interview',
  problem: '',
  constraints: '',
  solution: '',
}

const modeDescriptions: Record<Mode, string> = {
  interview: 'Balanced feedback for interview prep and communication.',
  simple: 'Quick scan with practical fixes and must-have tests.',
  deep: 'Detailed review with stronger rigor and implementation improvements.',
}

const modeAccent: Record<Mode, string> = {
  interview: 'from-violet-500 to-fuchsia-500',
  simple: 'from-cyan-500 to-blue-500',
  deep: 'from-emerald-500 to-teal-500',
}

const languages = [
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
  { id: 'cpp', label: 'C++' },
  { id: 'javascript', label: 'JavaScript' },
]

export default function AnalyzePage() {
  const [language, setLanguage] = useState(defaultDraft.language)
  const [mode, setMode] = useState<Mode>(defaultDraft.mode)
  const [problem, setProblem] = useState(defaultDraft.problem)
  const [constraints, setConstraints] = useState(defaultDraft.constraints)
  const [solution, setSolution] = useState(defaultDraft.solution)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resultsRef = useRef<HTMLDivElement | null>(null)

  const trimmedSolutionLength = solution.trim().length
  const canAnalyze = !loading && trimmedSolutionLength >= MIN_SOLUTION_LENGTH
  const completionRatio = Math.min(100, Math.round((trimmedSolutionLength / 220) * 100))
  const validationMessage = useMemo(() => {
    if (trimmedSolutionLength === 0) return 'Paste your solution to get started.'
    if (trimmedSolutionLength < MIN_SOLUTION_LENGTH) {
      return `Add ${MIN_SOLUTION_LENGTH - trimmedSolutionLength} more characters to unlock analysis.`
    }
    return 'Looks good. Run analysis when ready.'
  }, [trimmedSolutionLength])

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return

    try {
      const draft = JSON.parse(raw) as Partial<AnalyzeDraft>
      if (draft.language) setLanguage(draft.language)
      if (draft.mode) setMode(draft.mode)
      if (draft.problem) setProblem(draft.problem)
      if (draft.constraints) setConstraints(draft.constraints)
      if (draft.solution) setSolution(draft.solution)
    } catch {
      localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ language, mode, problem, constraints, solution } satisfies AnalyzeDraft),
    )
  }, [language, mode, problem, constraints, solution])

  useEffect(() => {
    if (result) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [result])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(timer)
  }, [copied])

  const onAnalyze = useCallback(async () => {
    if (!canAnalyze) return

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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Request failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [canAnalyze, constraints, language, mode, problem, solution])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canAnalyze) {
        event.preventDefault()
        void onAnalyze()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canAnalyze, onAnalyze])

  function fillExample() {
    setLanguage('java')
    setMode('interview')
    setProblem('Two Sum')
    setConstraints('n up to 1e5, exactly one solution')
    setSolution(`class Solution {
  public int[] twoSum(int[] nums, int target) {
    HashMap<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
      int need = target - nums[i];
      if (seen.containsKey(need)) return new int[] { seen.get(need), i };
      seen.put(nums[i], i);
    }
    return new int[] {-1, -1};
  }
}`)
    setError(null)
    setResult(null)
  }

  function clearAll() {
    setLanguage(defaultDraft.language)
    setMode(defaultDraft.mode)
    setProblem(defaultDraft.problem)
    setConstraints(defaultDraft.constraints)
    setSolution(defaultDraft.solution)
    setResult(null)
    setError(null)
    localStorage.removeItem(DRAFT_KEY)
  }

  async function copyResultJson() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      setCopied(true)
    } catch {
      setError('Clipboard is blocked in this browser context.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 md:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

          <header className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">AlgoMentor</h1>
              <p className="mt-2 text-slate-300">Modern feedback for algorithms: fast, clear, and actually useful.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={fillExample}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              >
                Load example
              </button>
              <button
                onClick={clearAll}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              >
                Clear
              </button>
            </div>
          </header>

          <div className="relative z-10 mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 md:p-5 space-y-5">
              <div>
                <p className="text-sm text-slate-300">Language</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {languages.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLanguage(item.id)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                        language === item.id
                          ? 'border-violet-400 bg-violet-500/20 text-violet-100'
                          : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-300">Feedback mode</p>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  {(Object.keys(modeDescriptions) as Mode[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setMode(item)}
                      className={`rounded-xl border p-3 text-left transition ${
                        mode === item
                          ? 'border-transparent bg-gradient-to-r text-white ' + modeAccent[item]
                          : 'border-white/15 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <p className="text-sm font-semibold capitalize">{item}</p>
                      <p className="mt-1 text-xs text-white/90">{modeDescriptions[item]}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InputField label="Problem (optional)" value={problem} onChange={setProblem} placeholder="e.g. Two Sum" />
                <InputField
                  label="Constraints (optional)"
                  value={constraints}
                  onChange={setConstraints}
                  placeholder="e.g. n up to 1e5"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-300">Solution</span>
                  <span className="text-slate-400">{trimmedSolutionLength} chars</span>
                </div>
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Paste your code here..."
                  className="h-64 w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 font-mono text-sm text-slate-100 outline-none ring-violet-400 transition focus:ring"
                />
                <div className="mt-3 space-y-2">
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all"
                      style={{ width: `${completionRatio}%` }}
                    />
                  </div>
                  <p className={`text-xs ${canAnalyze ? 'text-emerald-300' : 'text-amber-300'}`}>{validationMessage}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={onAnalyze}
                  disabled={!canAnalyze}
                  className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Analyzing…' : 'Analyze now'}
                </button>
                <p className="text-xs text-slate-400">Shortcut: Ctrl/Cmd + Enter</p>
                {error && <p className="text-sm text-rose-300">{error}</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm font-semibold text-slate-200">What you get</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Correctness intuition + proof sketch</li>
                <li>• Time/space complexity breakdown</li>
                <li>• Edge-case checklist</li>
                <li>• Targeted pitfalls and improvements</li>
                <li>• Interview-ready test scenarios</li>
              </ul>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <p className="font-medium">Crunching your solution...</p>
            <p className="mt-1 text-sm text-slate-400">Checking correctness, complexity, edge cases, and presentation.</p>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" />
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-slate-900/40 p-5 text-slate-300">
            Add your code and run analysis to see a full breakdown.
          </div>
        )}

        {result && (
          <div ref={resultsRef} className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Results</h2>
              <button
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
                onClick={copyResultJson}
              >
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>

            <Section title="Summary">
              <ul className="list-disc space-y-1 pl-6">
                {result.summary.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}
              </ul>
            </Section>

            <Section title="Correctness">
              <div className="space-y-2">
                <div><span className="font-semibold">Intuition:</span> {result.correctness.intuition}</div>
                <div>
                  <div className="font-semibold">Invariants:</div>
                  <ul className="list-disc pl-6">
                    {result.correctness.invariants.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}
                  </ul>
                </div>
                <div><span className="font-semibold">Proof sketch:</span> {result.correctness.proofSketch}</div>
              </div>
            </Section>

            <Section title="Complexity">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <MetricCard label="Time" value={result.complexity.time} />
                <MetricCard label="Space" value={result.complexity.space} />
              </div>
              <p className="mt-2 text-slate-300">{result.complexity.explanation}</p>
            </Section>

            <Section title="Edge Cases">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {result.edgeCases.map((edge, i) => (
                  <div key={`${edge.case}-${i}`} className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                    <div className="font-semibold">{edge.case}</div>
                    <div className="text-slate-300">{edge.why}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Pitfalls">
              <ul className="list-disc space-y-1 pl-6">
                {result.pitfalls.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}
              </ul>
            </Section>

            <Section title="Tests">
              <div className="overflow-auto rounded-xl border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="p-2 text-left">Input</th>
                      <th className="p-2 text-left">Expected</th>
                      <th className="p-2 text-left">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.tests.map((test, i) => (
                      <tr key={`${test.input}-${i}`} className="border-t border-white/10">
                        <td className="p-2 font-mono text-xs">{test.input}</td>
                        <td className="p-2 font-mono text-xs">{test.expected}</td>
                        <td className="p-2">{test.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Improvements">
              <ul className="list-disc space-y-1 pl-6">
                {result.improvements.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}
              </ul>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}

function InputField(props: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="text-sm text-slate-300">{props.label}</label>
      <input
        className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-violet-400 transition focus:ring"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
      />
    </div>
  )
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
      <div className="text-sm text-slate-400">{props.label}</div>
      <div className="text-lg font-semibold">{props.value}</div>
    </div>
  )
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <h3 className="mb-2 text-xl font-semibold">{props.title}</h3>
      {props.children}
    </section>
  )
}
