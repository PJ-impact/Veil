# Veil

Veil is a local-first, privacy-focused document intelligence workspace. It lets you upload, chat with, analyze, and safely sanitize sensitive documents without sending them to third-party cloud services by default.

## Features

- **Local Document Chat (RAG)** – Grounded Q&A over your documents with verifiable citations and evidence snippets. Supports local Ollama or cloud APIs as fallback.
- **Privacy Bridge** – Detect sensitive entities (PII/PHI, financial data, orgs/people/locations), redact/sanitize them with placeholders, and reconstruct responses after sending to external models.
- **Analysis Lab** – Summarize, compare documents, detect contradictions/conflicts across files, and explore dynamic insights.
- **Document Library** – Upload PDF, DOCX, TXT, or Markdown; automatic chunking, indexing, and scope control.
- **Zero-Leak by Design** – All data stays local (filesystem under `data/`). No telemetry. Manual copy/paste for external AI via Privacy Bridge.

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start dev server (runs Vite + Express via tsx server.ts)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app runs at `http://localhost:3000` by default.

## Environment

Copy `.env.example` to `.env` and configure as needed:

- `PORT` (default: 3000)
- `GEMINI_API_KEY` (optional) – enables Gemini 2.5 Flash fallback for chat
- Ollama settings configurable via UI or `data/settings.json` (default: `http://127.0.0.1:11434`, model `gemma`)

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Lucide Icons
- **Backend:** Express, tsx, Node.js
- **AI/RAG:** Local keyword/TF-IDF ranking with optional Ollama/Gemini, strict grounding with citations
- **Privacy:** Deterministic regex + contextual heuristics, placeholder mapping with strict reconstruction

## Project Structure

```
Veil/
├── src/                # React frontend
├── server.ts           # Express API + Vite middleware
├── public/             # Static assets (icons)
├── data/               # Local storage (documents, conversations, mappings, settings)
└── docs/               # Architecture notes
```

## License

MIT
