# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

ReadEasy is a **pure vanilla HTML/CSS/JS** single-page application with no build toolchain, no framework, and no package manager. Everything runs in the browser from three files: `index.html`, `styles.css`, `script.js`.

## Local Development

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

No build step. No `npm install`. Hard refresh (`Cmd+Shift+R`) to clear browser cache after edits.

Force Vercel redeploy when CI doesn't trigger:
```bash
git commit --allow-empty -m "Force redeploy" && git push
```

## Architecture

Three hash-routed views in a single `index.html`:

| Route | Feature | Key functions |
|---|---|---|
| `#/merge` | Combine 2–10 EPUBs via backend API | `combineEpubs()`, `addFiles()`, `testConnection()` |
| `#/reader` | Render articles from Chrome extension | `setupReaderMessaging()`, `renderReaderContent()`, `downloadAsEpub()` |
| `#/convert` | Plain text → reader view (auth-gated) | `handleConvertSubmit()`, `convertPlainTextToHtml()` |

### State objects (top of `script.js`)

- `state` — merge view (files list, apiUrl, blob)
- `readerState` — reader/convert (HTML content, EPUB context)
- `authState` — Google user info
- `editorState` — edit mode snapshot + dirty flag

All DOM references are cached once in the `elements` object at startup.

### Key flows

**Merge**: `addFiles()` → validates extension/size/count → `combineEpubs()` → FormData POST to Render API → progress faked at 30/60/90% → blob download.

**Reader**: Chrome extension posts `message` → `handleReaderMessage()` validates origin against `readerConfig.allowedOrigins` → `sanitizeArticleHtml()` strips scripts/iframes/event handlers → `renderReaderContent()` → optional `downloadAsEpub()` (JSZip, EPUB 2.0).

**Edit mode**: `enterEditMode()` snapshots content → `contenteditable` + `document.execCommand` for formatting → `exitEditMode(save)` restores snapshot if cancelled. `parseAndLoadEpub(file)` reads an EPUB ZIP (JSZip), extracts OPF/XHTML chapters into the editor.

**Auth**: Google Identity Services (GSI) loaded via CDN with 10×300ms retry → JWT decoded client-side → saved to `localStorage` under key `readeasy-auth`. **No server-side token validation** — auth gates the UI only.

### Sanitization

Two sanitizers exist for different contexts:
- `sanitizeArticleHtml(html, sourceUrl)` — for rendering in reader (resolves relative URLs, removes unsafe elements)
- `sanitizeEpubHtml(html)` / `convertToXhtml(html)` — for embedding in EPUB ZIP (strips `style`, `data-*`, event attrs; self-closes void elements)

### Themes

Three themes toggled via `data-theme` on `<body>`: `light` (default), `dark`, `warm`. CSS variables are defined in `:root` and overridden in `[data-theme="dark"]` / `[data-theme="warm"]` blocks in `styles.css`.

## Important configuration (hardcoded in `script.js`)

```js
apiUrl: 'https://epub-combiner-api.onrender.com'   // Render.com backend
allowedOrigins: [                                   // Extension postMessage whitelist
  'chrome-extension://floidkamdcekmpimibhckjfegjpgeeda',
  'chrome-extension://ffjopfamcpefiadpmnaoonhidikfdkif'
]
authConfig.clientId: '1013859959230-...'            // Google OAuth client ID
```

File limits: 2–10 files, 50 MB each, 100 MB total (API enforced). Realistic safe ceiling is 30–50 MB total due to Render free-tier RAM (512 MB, ~3–4× peak usage per input size).

## Documentation

- `doc/architecture.md` — comprehensive function reference and data flow diagrams
- `QUICK_START_AI.md` — 30-second function map for AI onboarding
- `INTEGRATION-combine-epub.md` — API integration examples (JS/Python/PHP/Ruby)
- `WEBAPP_POSTMESSAGE_README.md` — postMessage protocol spec for the Chrome extension
- `doc/sprint-2026-*.md` — sprint logs with rationale for architectural decisions
