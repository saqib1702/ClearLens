# ClearLens — Intelligence Platform

AI-powered multi-dimensional news bias and credibility analysis.

## Features

- **Bias Detection** — Political lean scored -100 to +100 with AI rationale
- **Credibility Assessment** — Overall score with sub-factors (emotional language, source balance, factual density)
- **Missing Facts** — Identifies gaps and omissions in reporting
- **Global Perspectives** — How 6+ countries frame the same story
- **AI Predictions** — Forecasts with confidence scores and alternative scenarios
- **Article Comparison** — Side-by-side bias analysis of two articles
- **Conflict Dashboard** — Interactive globe and live conflict tracker

## Architecture

```
clearlens.html    → Single-file frontend (static)
api/analyze.js    → Vercel serverless function (proxies Gemini API)
api/news.js       → Vercel serverless function (proxies NewsAPI)
api/fetch-url.js  → Vercel serverless function (server-side article fetch for the URL importer)
```

API keys are stored **server-side only** as environment variables — they are never exposed to the browser.

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/clearlens.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository
2. Vercel will auto-detect the project (static + serverless functions)
3. No build command or framework needed — it deploys as-is

### 3. Set Environment Variables

In the Vercel dashboard, go to **Settings → Environment Variables** and add:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key ([get one free](https://aistudio.google.com)) |
| `NEWS_API_KEY` | No | NewsAPI key for live headlines ([get one free](https://newsapi.org)) |

### 4. Redeploy

After setting environment variables, trigger a redeployment from the Vercel dashboard (Deployments → Redeploy).

## Local Development

For local testing without a server, the app falls back to realistic demo/mock data automatically when the API endpoints return errors.

To test with real APIs locally, you can use the [Vercel CLI](https://vercel.com/docs/cli):

```bash
npm i -g vercel
vercel env pull .env.local
vercel dev
```

This starts a local server at `localhost:3000` with your environment variables loaded.

## Offline / Demo Mode

When API calls fail (no internet, missing keys, rate limits), the app automatically:
- Falls back to realistic mock data
- Shows a "Demo Mode" badge
- Keeps all pages fully functional

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS, Space Grotesk + Inter fonts, Lucide icons
- **Backend**: Vercel Serverless Functions (Node.js)
- **AI**: Google Gemini 2.0 Flash (structured JSON output)
- **Globe**: globe.gl (loaded from CDN with 3-second timeout fallback)
- **Design**: Bento grid minimalist dark/light theme
