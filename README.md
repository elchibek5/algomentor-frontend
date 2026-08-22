# AlgoMentor — Frontend

React + TypeScript interface for [AlgoMentor](https://github.com/elchibek5/algomentor-backend).
Paste an algorithm solution, get a structured breakdown: correctness, complexity, edge cases,
pitfalls, tests, and improvements.

Single-page, no router, no state library. The interesting parts are the API boundary — typed
errors that explain themselves — and being honest with the user about what the backend is
actually doing.

> **Backend:** [algomentor-backend](https://github.com/elchibek5/algomentor-backend) ·
> **Stack:** React 19 · TypeScript 5.9 · Vite 7 · Tailwind 4

---

## Contents

- [Quick start](#quick-start) · [Codebase map](#codebase-map)
- [The API boundary](#the-api-boundary) · [State and persistence](#state-and-persistence)
- [Configuration](#configuration) · [Commands](#commands)
- [Extending it](#extending-it) · [Design decisions](#design-decisions)
- [Contributing](#contributing) · [Troubleshooting](#troubleshooting)

---

## Quick start

The backend runs with **no API key** thanks to its demo mode, so the full stack is two
commands per side.

```bash
# Terminal 1 — backend
git clone https://github.com/elchibek5/algomentor-backend
cd algomentor-backend && ./mvnw spring-boot:run
```

```bash
# Terminal 2 — frontend
git clone https://github.com/elchibek5/algomentor-frontend
cd algomentor-frontend
npm install
npm run dev
```

Open <http://localhost:5173>, click **Load example**, then **Analyze now**.

**Requirements:** Node.js 18+ here, Java 21+ for the backend.

### What you'll see first

An amber banner saying the backend is in **demo mode**. That is expected on a fresh clone —
analyses are generated offline from pattern matching, not by a model. They react to your code
(nested loops report `O(n^2)`, hash maps `O(n)`) but are not real reviews.

This is deliberate and it is good for frontend work: **the whole UI is developable without an
API key or a cent of spend.** Add a key to the backend's `.env.local` when you need real
output; the banner disappears on its own.

---

## Codebase map

```
src/
├── main.tsx                 entry; mounts App inside ErrorBoundary
├── App.tsx                  renders AnalyzePage — the only route
├── index.css                one line: @import "tailwindcss"
├── types.ts                 AnalyzeRequest / AnalyzeResponse / Health
│
├── api/
│   ├── client.ts            fetch wrapper: base URL, timeout, ApiError
│   └── analyze.ts           analyzeSolution() and fetchHealth()
│
├── components/
│   ├── ErrorBoundary.tsx    catches render crashes, offers reload
│   └── StatusBanner.tsx     offline / demo-mode warnings
│
└── pages/
    └── AnalyzePage.tsx      the entire interface — form, results, shortcuts
```

`AnalyzePage.tsx` holds nearly all the UI. Its small presentational helpers (`InputField`,
`MetricCard`, `Section`) live at the bottom of the same file; promote one to `components/` when
a second file needs it.

| I want to… | Touch |
|---|---|
| Change how results render | `AnalyzePage.tsx`, the `{result && ...}` block |
| Add a form field | `AnalyzePage.tsx` state + `types.ts` + the backend's `AnalyzeRequest` |
| Change error or timeout behavior | `api/client.ts` |
| Change the demo/offline warnings | `components/StatusBanner.tsx` |
| Add a language or mode option | The `languages` / `modeDescriptions` consts in `AnalyzePage.tsx` |
| Restyle | Tailwind classes inline; the palette is `slate` + `violet`/`cyan` accents |

---

## The API boundary

All network access goes through `apiFetch` in `api/client.ts`, which normalizes three failure
modes into one typed error:

```ts
export class ApiError extends Error {
  readonly kind: 'offline' | 'timeout' | 'server'
  readonly hint?: string
}
```

| `kind` | When | What the user sees |
|---|---|---|
| `offline` | `fetch` rejected — nothing answered | The URL it tried, and how to start the backend |
| `timeout` | Exceeded `VITE_REQUEST_TIMEOUT_MS` | Suggestion to retry |
| `server` | Backend answered with a non-2xx | The backend's own `message` field |

`server` errors reuse the backend's message because it is already written for humans
("The OPENAI_API_KEY was rejected…", "Rate limit or quota exceeded…"). Restating those in the
client would only let the two drift apart.

Consumers stay small:

```ts
export function analyzeSolution(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  return apiFetch<AnalyzeResponse>('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
```

**Types are hand-mirrored** from the backend's DTOs in `types.ts`. There is no codegen, so
changing the schema means editing both sides. If the shapes drift, TypeScript will not catch it
— the response is cast, not parsed. Worth knowing before you rely on a new field.

---

## State and persistence

Plain `useState` in `AnalyzePage`. No Redux, Zustand, or Context — there is one page and no
shared state to coordinate.

- **Draft autosave** — every field is written to `localStorage` under
  `algomentor-analyze-draft-v1` on change, and restored on mount. Corrupt JSON is discarded
  rather than thrown. Bump the key's version suffix if you change the draft shape.
- **Results are not persisted** — they belong to one analysis run and are cleared on the next.
- **`Ctrl`/`Cmd` + `Enter`** submits, via a window listener gated on the same `canAnalyze` flag
  as the button, so the shortcut can never do something the button would not.
- **Autoscroll** — results scroll into view when they arrive.

---

## Configuration

Defaults work with a backend on `localhost:8080`. To change them:

```bash
cp .env.local.example .env.local
```

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend origin |
| `VITE_REQUEST_TIMEOUT_MS` | `25000` | Abort a request after this long |

Two Vite rules that cause most of the confusion here:

1. Only variables prefixed `VITE_` are exposed to client code.
2. They are inlined at **startup** — restart the dev server after editing, a hot reload will
   not pick them up.

`.env.local` is gitignored.

---

## Commands

```bash
npm run dev        # dev server with HMR on :5173
npm run build      # tsc -b && vite build  → dist/
npm run preview    # serve the production build
npm run lint       # ESLint
```

`npm run build` typechecks first, so a type error fails the build rather than shipping.

**TypeScript is strict**, including two rules that surprise people:

- `verbatimModuleSyntax` — types must be imported with `import type { Foo }`
- `erasableSyntaxOnly` — no constructor parameter properties; declare fields explicitly

Both surface as build errors with clear codes (`TS1484`, `TS1294`).

---

## Extending it

<details>
<summary><b>Render a new field from the analysis</b></summary>

1. Add it to the matching type in `types.ts`
2. Render it in `AnalyzePage.tsx` — wrap it in `<Section title="...">` to match the others

The backend must send it first; see its README on changing the schema. Until then the field
arrives `undefined`, so guard before mapping over it.
</details>

<details>
<summary><b>Add a supported language</b></summary>

```ts
const languages = [
  { id: 'java', label: 'Java' },
  { id: 'rust', label: 'Rust' },   // ← id goes to the API, label is shown
]
```

The backend accepts any string up to 30 chars, so no server change is needed.
</details>

<details>
<summary><b>Add a page</b></summary>

There is no router. Add one (`react-router-dom`), move `AnalyzePage` behind a route in
`App.tsx`, and keep `ErrorBoundary` wrapping the whole tree in `main.tsx`.
</details>

<details>
<summary><b>Point at a deployed backend</b></summary>

Set `VITE_API_BASE_URL` to its origin and add this app's origin to the backend's
`APP_CORS_ALLOWED_ORIGINS`. Both must agree or the browser blocks the request.
</details>

---

## Design decisions

**One fetch wrapper, not fetch calls scattered across components.** Timeout, base URL, JSON
handling, and error shaping are decided once. Adding an endpoint is four lines and inherits all
of it.

**A network failure is a different thing from a 500.** `fetch` rejecting means nothing answered
— almost always a backend that is not running. That deserves "start the backend", not "Failed
to fetch". The `kind` discriminator exists so the UI can say something useful.

**The status banner is not decoration.** Without it, demo output and a real review look
identical, and a stopped backend looks like a broken app. Reading `/api/health` once on mount
is a cheap way to never mislead the user. The demo banner is dismissable; the offline one is
not, because nothing works until it is fixed.

**Drafts persist, results do not.** Losing pasted code to an accidental reload is painful.
Stale results shown against edited code would be worse than showing none.

**Tailwind utilities inline, no component library.** One page, one visual language. A design
system would be more indirection than the surface justifies.

**An `ErrorBoundary` at the root.** A render crash otherwise blanks the page with no
explanation. It also catches unhandled promise rejections, so a stray async failure surfaces
instead of vanishing into the console.

---

## Contributing

```bash
npm run lint && npm run build    # before you push
```

- Functional components with hooks; no classes except where React requires them
- Keep `apiFetch` the only caller of `fetch`
- Throw `ApiError` with a `hint` whenever the user could act on the failure
- Mirror backend DTO changes in `types.ts` in the same PR
- Tailwind utilities inline; no CSS files beyond `index.css`

There is no test suite yet. `npm run build` typechecks, which catches shape mistakes but not
behavior — worth adding Vitest + Testing Library if you are extending the UI meaningfully.

---

## Troubleshooting

**Red banner: "Backend not reachable."** It means what it says. Start the backend and reload:
```bash
curl http://localhost:8080/api/health    # should return {"ok":true,...}
```

**Amber banner: "Demo mode."** Expected without an API key. Analyses are canned. Add
`OPENAI_API_KEY` to the backend's `.env.local` and restart it.

**Port 5173 in use.** Vite moves to `:5174` and prints the real URL. That new origin must also
be in the backend's `APP_CORS_ALLOWED_ORIGINS`, or every request is blocked.

**CORS errors in the console.** The backend allows `:5173` and `:5174` by default. Anything
else has to be added there.

**Env change had no effect.** Restart the dev server — Vite reads `.env` files at startup only.
Confirm the variable is prefixed `VITE_`.

**Changes not appearing.** Hard-reload with `Cmd`/`Ctrl` + `Shift` + `R`.

**Dependency problems.**
```bash
rm -rf node_modules package-lock.json && npm install
```

---

## Author

**Elchibek Dastanov** — Computer Science Student | Software Engineer
