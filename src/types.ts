export type AnalyzeRequest = {
  language: string
  mode: 'interview' | 'simple' | 'deep'
  problem?: string
  constraints?: string
  solution: string
}

export type AnalyzeResponse = {
  summary: string[]
  correctness: {
    intuition: string
    invariants: string[]
    proofSketch: string
  }
  complexity: {
    time: string
    space: string
    explanation: string
  }
  edgeCases: {
    case: string
    why: string
  }[]
  pitfalls: string[]
  tests: {
    input: string
    expected: string
    purpose: string
  }[]
  improvements: string[]
}
