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
  interview: 'Balanced feedback focused on correctness, complexity, and communication.',
  simple: 'Short and practical feedback with concise fixes and key tests.',
  deep: 'Detailed technical review with stronger rigor and implementation advice.',
}

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
  const validationMessage = useMemo(() => {
    if (trimmedSolutionLength === 0) return 'Paste your solution to start analysis.'
    if (trimmedSolutionLength < MIN_SOLUTION_LENGTH) {
      return `Add at least ${MIN_SOLUTION_LENGTH - trimmedSolutionLength} more characters for meaningful feedback.`
    }
    return null
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
    if (result) resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [result])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(timer)
  }, [copied])

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

  async function copyResultJson() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      setCopied(true)
    } catch {
      setError('Could not copy to clipboard on this browser.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">AlgoMentor</h1>
            <p className="text-gray-600">Level up your solution with clearer algorithm feedback in one pass.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fillExample}
              className="px-4 py-2 rounded border bg-white hover:bg-gray-100"
            >
              Load example
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 rounded border bg-white hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
        </header>

        <div className="bg-white rounded-xl border p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Language</label>
              <select
                className="mt-1 w-full border rounded px-3 py-2"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">Mode</label>
              <select
                className="mt-1 w-full border rounded px-3 py-2"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
              >
                <option value="interview">Interview</option>
                <option value="simple">Simple</option>
                <option value="deep">Deep</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">{modeDescriptions[mode]}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Problem (optional)</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="e.g., Two Sum"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Constraints (optional)</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="e.g., n up to 1e5"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600">Solution</label>
              <span className="text-xs text-gray-500">{trimmedSolutionLength} chars</span>
            </div>
            <textarea
              className="mt-1 w-full border rounded px-3 py-2 h-56 font-mono text-sm"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Paste your code here..."
            />
            <p className="text-xs text-gray-500 mt-1">Shortcut: Ctrl/Cmd + Enter to analyze.</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              onClick={onAnalyze}
              disabled={!canAnalyze}
              className="px-5 py-2 rounded bg-black text-white disabled:opacity-50"
            >
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>

            {validationMessage && <p className="text-amber-700 text-sm">{validationMessage}</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <p className="font-medium">Analyzing your solution…</p>
            <div className="h-2 bg-gray-100 rounded overflow-hidden">
              <div className="h-full w-1/2 bg-gray-700 animate-pulse" />
            </div>
            <p className="text-sm text-gray-600">Reviewing correctness, complexity, edge cases, and improvements.</p>
          </div>
        )}

        {!result && !loading && (
          <div className="rounded-xl border border-dashed bg-white p-4 text-gray-600">
            <p className="font-medium text-gray-800">Ready when you are.</p>
            <p className="text-sm">Tip: include problem context and constraints for more relevant analysis.</p>
          </div>
        )}

        {result && (
          <div ref={resultsRef} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Results</h2>
              <button
                className="px-4 py-2 rounded border bg-white hover:bg-gray-100"
                onClick={copyResultJson}
              >
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>

            <Section title="Summary">
              <ul className="list-disc pl-6 space-y-1">
                {result.summary.map((s, i) => <li key={`${s}-${i}`}>{s}</li>)}
              </ul>
            </Section>

            <Section title="Correctness">
              <div className="space-y-2">
                <div><span className="font-semibold">Intuition:</span> {result.correctness.intuition}</div>
                <div>
                  <div className="font-semibold">Invariants:</div>
                  <ul className="list-disc pl-6">
                    {result.correctness.invariants.map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}
                  </ul>
                </div>
                <div><span className="font-semibold">Proof sketch:</span> {result.correctness.proofSketch}</div>
              </div>
            </Section>

            <Section title="Complexity">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded border p-3 bg-white">
                  <div className="text-sm text-gray-600">Time</div>
                  <div className="text-lg font-semibold">{result.complexity.time}</div>
                </div>
                <div className="rounded border p-3 bg-white">
                  <div className="text-sm text-gray-600">Space</div>
                  <div className="text-lg font-semibold">{result.complexity.space}</div>
                </div>
              </div>
              <p className="text-gray-700 mt-2">{result.complexity.explanation}</p>
            </Section>

            <Section title="Edge Cases">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.edgeCases.map((edge, i) => (
                  <div key={`${edge.case}-${i}`} className="rounded border p-3 bg-white">
                    <div className="font-semibold">{edge.case}</div>
                    <div className="text-gray-700">{edge.why}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Pitfalls">
              <ul className="list-disc pl-6 space-y-1">
                {result.pitfalls.map((pitfall, i) => <li key={`${pitfall}-${i}`}>{pitfall}</li>)}
              </ul>
            </Section>

            <Section title="Tests">
              <div className="overflow-auto bg-white border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-2">Input</th>
                      <th className="text-left p-2">Expected</th>
                      <th className="text-left p-2">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.tests.map((test, i) => (
                      <tr key={`${test.input}-${i}`} className="border-t">
                        <td className="p-2 font-mono">{test.input}</td>
                        <td className="p-2 font-mono">{test.expected}</td>
                        <td className="p-2">{test.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Improvements">
              <ul className="list-disc pl-6 space-y-1">
                {result.improvements.map((improvement, i) => <li key={`${improvement}-${i}`}>{improvement}</li>)}
              </ul>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-gray-50 border rounded-xl p-4">
      <h2 className="text-xl font-semibold mb-2">{props.title}</h2>
      {props.children}
    </section>
  )
}
