# AlgoMentor — Frontend

React + TypeScript interface for [AlgoMentor](https://github.com/elchibek5/algomentor-backend).
Paste an algorithm solution, get a structured breakdown: correctness, complexity, edge cases,
pitfalls, tests, and improvements.

> **Backend lives here:** [algomentor-backend](https://github.com/elchibek5/algomentor-backend)

---

## Run it in 60 seconds

You need the backend running first — it takes one command and **no API key**:

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

**Requirements:** Node.js 18+ for the frontend, Java 21+ for the backend.

---

## What you'll see

The backend runs in **demo mode** until you give it an OpenAI key, and the app tells you so
with a banner. Demo analyses are generated offline — they react to your code (nested loops
report `O(n^2)`, hash maps report `O(n)`) but they are not real reviews.

To get real analysis, add a key to the backend's `.env.local` and restart it. The banner
disappears on its own. See the
[backend README](https://github.com/elchibek5/algomentor-backend#demo-mode-vs-live-mode).

---

## Features

- **Three analysis modes** — interview, simple, and deep
- **Draft autosave** — your input survives a page reload
- **Keyboard shortcut** — `Ctrl`/`Cmd` + `Enter` to analyze
- **Copy as JSON** — grab the full structured result
- **Honest status** — a banner when the backend is offline or running canned analyses
- **Load example** — prefilled Two Sum solution to try it instantly

---

## Configuration

Defaults work out of the box. To point at a backend somewhere other than
`http://localhost:8080`:

```bash
cp .env.local.example .env.local
```

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend origin |
| `VITE_REQUEST_TIMEOUT_MS` | `25000` | Abort a request after this long |

Vite only exposes variables prefixed `VITE_`, and it reads them at **startup** — restart the
dev server after editing.

---

## Commands

```bash
npm run dev        # dev server with hot reload, on :5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build locally
npm run lint       # ESLint
```

---

## Project structure

```
src/
├── api/
│   ├── client.ts          shared fetch wrapper, timeouts, typed ApiError
│   └── analyze.ts         analyze + health endpoints
├── components/
│   ├── ErrorBoundary.tsx  catches render crashes, offers reload
│   └── StatusBanner.tsx   offline / demo-mode warnings
├── pages/
│   └── AnalyzePage.tsx    the whole interface
├── types.ts               request, response, and health shapes
└── main.tsx               entry point
```

---

## Troubleshooting

**"Backend not reachable"** — the banner means exactly what it says. Start the backend, then
reload. Verify with `curl http://localhost:8080/api/health`.

**Port 5173 in use** — Vite picks the next free port and prints it. Add that origin to the
backend's `APP_CORS_ALLOWED_ORIGINS` or CORS will block the requests.

**CORS errors in the console** — the backend allows `:5173` and `:5174` by default. Any other
origin has to be added there.

**Changes not showing** — hard-reload with `Cmd`/`Ctrl` + `Shift` + `R`.

**Dependency problems**
```bash
rm -rf node_modules package-lock.json && npm install
```

---

## Built with

React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS 4

---

## Author

**Elchibek Dastanov** — Computer Science Student | Software Engineer
