import { useEffect, useRef, useState } from 'react'
import { analyzeSolution } from '../api/analyze'
import type { AnalyzeResponse } from '../types'

export default function AnalyzePage() {
  const [language, setLanguage] = useState('java')
  const [mode, setMode] = useState<'interview' | 'simple' | 'deep'>('interview')
  const [problem, setProblem] = useState('')
  const [constraints, setConstraints] = useState('')
  const [solution, setSolution] = useState('')
  const [loading, setLoading] = useState(false)

  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resultsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (result) resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [result])

  function fillExample() {
    setLanguage('java')
    setMode('interview')
    setProblem('Two Sum')
    setConstraints('n up to 1e5, exactly one solution')
    setSolution(`class Solution {
  public int[] twoSum(int[] nums, int target) {
    // TODO
    return new int[]{0, 0};
  }
}`)
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
    } catch (e: any) {
      setError(e?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AlgoMentor</h1>
            <p className="text-gray-600">Paste a solution, get structured feedback.</p>
          </div>
          <button
            onClick={fillExample}
            className="px-4 py-2 rounded border bg-white hover:bg-gray-100"
          >
            Load example
          </button>
        </header>

        {/* Form */}
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
                onChange={(e) => setMode(e.target.value as any)}
              >
                <option value="interview">Interview</option>
                <option value="simple">Simple</option>
                <option value="deep">Deep</option>
              </select>
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
            <label className="text-sm text-gray-600">Solution</label>
            <textarea
              className="mt-1 w-full border rounded px-3 py-2 h-56 font-mono text-sm"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Paste your code here..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onAnalyze}
              disabled={loading || solution.trim().length === 0}
              className="px-5 py-2 rounded bg-black text-white disabled:opacity-50"
            >
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>

            {error && <p className="text-red-600">{error}</p>}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Results</h2>
              <button
                className="px-4 py-2 rounded border bg-white hover:bg-gray-100"
                onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
              >
                Copy JSON
              </button>
            </div>

            <Section title="Summary">
              <ul className="list-disc pl-6 space-y-1">
                {result.summary.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </Section>

            <Section title="Correctness">
              <div className="space-y-2">
                <div><span className="font-semibold">Intuition:</span> {result.correctness.intuition}</div>
                <div>
                  <div className="font-semibold">Invariants:</div>
                  <ul className="list-disc pl-6">
                    {result.correctness.invariants.map((x, i) => <li key={i}>{x}</li>)}
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
                {result.edgeCases.map((e, i) => (
                  <div key={i} className="rounded border p-3 bg-white">
                    <div className="font-semibold">{e.case}</div>
                    <div className="text-gray-700">{e.why}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Pitfalls">
              <ul className="list-disc pl-6 space-y-1">
                {result.pitfalls.map((p, i) => <li key={i}>{p}</li>)}
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
                    {result.tests.map((t, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 font-mono">{t.input}</td>
                        <td className="p-2 font-mono">{t.expected}</td>
                        <td className="p-2">{t.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Improvements">
              <ul className="list-disc pl-6 space-y-1">
                {result.improvements.map((x, i) => <li key={i}>{x}</li>)}
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
