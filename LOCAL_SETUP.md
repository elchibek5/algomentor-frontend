# Local Development Setup - AlgoMentor Frontend

## Prerequisites

- Node.js 18+ (get it from [nodejs.org](https://nodejs.org/))
- npm or yarn
- AlgoMentor Backend running locally (see backend setup)

## Quick Start (4 steps)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Make sure the `VITE_API_BASE_URL` matches your backend URL (default: `http://localhost:8080`)

### 3. Start Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 4. Open in Browser

Visit `http://localhost:5173` and start analyzing algorithms!

## Available Commands

### Development
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

### Build & Deploy
```bash
npm run build        # Creates optimized production build in ./dist
```

## Folder Structure

```
src/
├── api/              # API client functions
├── pages/            # Page components
├── assets/           # Static assets
├── types.ts          # TypeScript type definitions
├── main.tsx          # App entry point
└── index.css         # Global styles
```

## Common Issues

### Backend Not Connecting
- Verify backend is running: `curl http://localhost:8080/api/health`
- Check `VITE_API_BASE_URL` in `.env.local` matches your backend URL
- Check browser console for CORS errors

### Port 5173 Already in Use
Vite automatically tries the next available port. Check the terminal output for the actual URL.

### Changes Not Reflecting
- Clear browser cache (Cmd/Ctrl + Shift + R)
- Restart dev server: press `q` then `npm run dev`

### Node Modules Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

- Use Cmd/Ctrl + Enter to analyze code (keyboard shortcut)
- Your drafts are saved locally in browser storage
- Use the "Load example" button to test with sample code
- Check the browser DevTools Console for API errors

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder that's ready to deploy.

## Environment Variables Reference

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_API_BASE_URL` | Backend API URL | http://localhost:8080 |
| `VITE_REQUEST_TIMEOUT_MS` | API request timeout | 25000 |
