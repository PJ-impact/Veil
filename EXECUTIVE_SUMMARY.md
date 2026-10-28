# Executive Summary: Veil

**Veil** is a local-first, privacy-focused document intelligence workspace that enables secure analysis, Q&A, and sanitization of sensitive documents without relying on cloud services by default. 

## Core Capabilities

- **Grounded Document Intelligence**: Upload PDFs, DOCX, TXT, or Markdown files and chat with them using local RAG. All responses are grounded with verifiable citations and evidence snippets.
- **Privacy Bridge**: Detects PII/PHI, financial data, organizations, people, and locations using deterministic regex and contextual heuristics. Sensitive entities are replaced with stable placeholders and can be reconstructed locally after manual consultation with external AI models.
- **Analysis Lab**: Provides document summarization, cross-document comparison, and contradiction detection to surface inconsistencies across files.
- **Zero-Leak Architecture**: All data remains local in the filesystem (`data/` directory). No telemetry is collected, and external AI interactions occur only through explicit manual copy/paste workflows via the Privacy Bridge.

## Technical Highlights

- **Hybrid AI Support**: Prioritizes Gemini 2.5 Flash (via API key) with fallback to local Ollama (e.g., Gemma) or a built-in heuristic synthesizer for offline operation.
- **Strict Grounding**: Implements keyword/TF-IDF ranking with explicit citation mapping and evidence gap detection to prevent hallucinations.
- **Secure Sanitization**: Session-isolated placeholder mapping ensures original values never leave the local environment, with strict reconstruction that only replaces known tokens.

## Target Use Cases

Legal review, financial due diligence, compliance analysis, and any workflow requiring confidential document intelligence without exposing sensitive data to third-party cloud services. 

**Status**: Production-ready local application built with React 19, TypeScript, Vite, Express, and Tailwind CSS 4.
