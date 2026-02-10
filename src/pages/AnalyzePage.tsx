import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzeSolution } from '../api/analyze'
import type { AnalyzeResponse, AnalyzeMode } from '../types'

const LANGUAGE_OPTIONS = [
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'javascript', label: 'JavaScript' },
] as const

const MODE_OPTIONS: { value: AnalyzeMode; label: string; description: string }[] = [
  {
    value: 'interview',
    label: 'Interview',
    description: 'Balanced feedback for interview-style communication and correctness.',
  },
  {
    value: 'simple',
    label: 'Simple',
    description: 'Quick, concise insights with less depth.',
  },
  {
    value: 'deep',
    label: 'Deep',
    description: 'Thorough analysis with stronger proof and testing guidance.',
  },
]

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
    setConstraints('n up to 1e5, exactly one solution')
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">AlgoMentor</h1>
            <p className="text-gray-600">Paste a solution, get structured feedback.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fillExample}
              className="px-4 py-2 rounded border bg-white hover:bg-gray-100"
            >
              Load example
            </button>
            <button
              onClick={clearForm}
              className="px-4 py-2 rounded border bg-white hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
        </header>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Mode guidance</p>
          <p className="mt-1">{selectedMode?.description}</p>
        </div>

        <div className="bg-white rounded-xl border p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="language" className="text-sm text-gray-600">
                Language
              </label>
              <select
                id="language"
                className="mt-1 w-full border rounded px-3 py-2"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mode" className="text-sm text-gray-600">
                Mode
              </label>
              <select
                id="mode"
                className="mt-1 w-full border rounded px-3 py-2"
                value={mode}
                onChange={(event) => setMode(event.target.value as AnalyzeMode)}
              >
                {MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="problem" className="text-sm text-gray-600">
                Problem (optional)
              </label>
              <input
                id="problem"
                className="mt-1 w-full border rounded px-3 py-2"
                value={problem}
                onChange={(event) => setProblem(event.target.value)}
                placeholder="e.g., Two Sum"
              />
            </div>

            <div>
              <label htmlFor="constraints" className="text-sm text-gray-600">
                Constraints (optional)
              </label>
              <input
                id="constraints"
                className="mt-1 w-full border rounded px-3 py-2"
                value={constraints}
                onChange={(event) => setConstraints(event.target.value)}
                placeholder="e.g., n up to 1e5"
              />
            </div>
          </div>

          <div>
            <label htmlFor="solution" className="text-sm text-gray-600">
              Solution
            </label>
            <textarea
              id="solution"
              className="mt-1 w-full border rounded px-3 py-2 h-56 font-mono text-sm"
              value={solution}
              onChange={(event) => setSolution(event.target.value)}
              placeholder="Paste your code here..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onAnalyze}
              disabled={loading || solution.trim().length === 0}
              className="px-5 py-2 rounded bg-black text-white disabled:opacity-50"
            >
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>

            {loading && <p className="text-sm text-gray-500">Generating structured feedback…</p>}
            {error && <p className="text-red-600">{error}</p>}
          </div>
        </div>

        {result && (
          <div ref={resultsRef} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Results</h2>
              <button
                className="px-4 py-2 rounded border bg-white hover:bg-gray-100"
                onClick={copyResultJson}
              >
                Copy JSON
              </button>
            </div>

            <Section title="Summary">
              <ul className="list-disc pl-6 space-y-1">
                {result.summary.map((summaryLine, index) => (
                  <li key={index}>{summaryLine}</li>
                ))}
              </ul>
            </Section>

            <Section title="Correctness">
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Intuition:</span> {result.correctness.intuition}
                </div>
                <div>
                  <div className="font-semibold">Invariants:</div>
                  <ul className="list-disc pl-6">
                    {result.correctness.invariants.map((invariant, index) => (
                      <li key={index}>{invariant}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold">Proof sketch:</span> {result.correctness.proofSketch}
                </div>
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
                {result.edgeCases.map((edgeCase, index) => (
                  <div key={index} className="rounded border p-3 bg-white">
                    <div className="font-semibold">{edgeCase.case}</div>
                    <div className="text-gray-700">{edgeCase.why}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Pitfalls">
              <ul className="list-disc pl-6 space-y-1">
                {result.pitfalls.map((pitfall, index) => (
                  <li key={index}>{pitfall}</li>
                ))}
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
                    {result.tests.map((test, index) => (
                      <tr key={index} className="border-t">
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
                {result.improvements.map((improvement, index) => (
                  <li key={index}>{improvement}</li>
                ))}
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
