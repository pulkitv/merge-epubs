# Project Architecture

**Project**: ReadEasy Web App (EPUB Combiner + Reader)
**Live URL**: https://merge-epubs.vercel.app
**API URL**: https://epub-combiner-api.onrender.com
**Repo**: https://github.com/pulkitv/merge-epubs
**Last Updated**: 2026-05-26

---

## Table of Contents

1. [What This Project Is](#what-this-project-is)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [File Structure](#file-structure)
5. [Code Structure](#code-structure)
6. [State Management](#state-management)
7. [DOM Elements Cache](#dom-elements-cache)
8. [Core Functions Reference](#core-functions-reference)
9. [Routing](#routing)
10. [Authentication](#authentication)
11. [Features Breakdown](#features-breakdown)
12. [API Integration](#api-integration)
13. [File Processing Flow](#file-processing-flow)
14. [Performance & Limits](#performance--limits)
15. [Development Guide](#development-guide)
16. [Deployment Guide](#deployment-guide)
17. [Security](#security)
18. [Troubleshooting](#troubleshooting)
19. [Known Constraints & Future Work](#known-constraints--future-work)
20. [Important Files Reference](#important-files-reference)

---

## What This Project Is

A single-page web application with three distinct modes (tabs):

1. **Merge EPUBs** (`#/merge`) — Upload 2–10 EPUB files, send them to a backend API, download a single combined EPUB with an auto-generated table of contents.
2. **Reader View** (`#/reader`) — A clean reading interface that receives article HTML from a Chrome extension (ReadEasy) via `postMessage`. Users can cycle through three themes (light/dark/warm), change font size, edit the article in-place, upload an EPUB file to read locally, paginate through multi-chapter EPUBs, browse a Supabase-backed Library of saved articles, and download the article as an EPUB file generated entirely in the browser.
3. **Convert Text** (`#/convert`) — Paste or type plain text, preview it in the reader, and optionally download as EPUB. Gated behind Google Sign-In.

---

## Tech Stack

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+) | Vercel (static) |
| EPUB Combiner API | Express.js / Node.js | Render.com (free tier) |
| Library API | Vercel Serverless Functions (Node.js runtime) | Vercel (same project) |
| Library storage | Supabase (Postgres + Storage bucket `article-content`) | Supabase cloud |
| Auth | Google Identity Services (GSI) + server-side tokeninfo validation | Client + Vercel functions |
| EPUB generation (reader/convert) | JSZip (browser library) | Client-side only |
| EPUB parsing (reader upload) | JSZip + DOMParser | Client-side only |
| EPUB combining | Backend API | Render |

No frameworks, no bundlers, no build step on the frontend. The frontend is three files: `index.html`, `styles.css`, `script.js`. The Vercel serverless functions in `api/` are also dependency-free (no `npm install` — they only use `fetch` and `process.env`).

**Frontend size**: ~50 KB (HTML + CSS + JS)

---

## System Architecture

```
┌──────────────────────────────────────────────────┐
│                  User Browser                     │
│                                                   │
│  ┌────────────────────────────────────────────┐  │
│  │   ReadEasy Web App (Vercel)                │  │
│  │   index.html / styles.css / script.js      │  │
│  │                                            │  │
│  │   Three views (hash-based routing):        │  │
│  │   /#/merge    → EPUB Combiner              │  │
│  │   /#/reader   → Reader View                │  │
│  │   /#/convert  → Convert Text (auth-gated)  │  │
│  └──────────────┬─────────────────────────────┘  │
│                 │                                  │
│  ┌──────────────▼─────────────────────────────┐  │
│  │   Chrome Extension (ReadEasy)              │  │
│  │   Sends article via window.postMessage     │  │
│  └────────────────────────────────────────────┘  │
└────┬─────────────────────┬───────────────────────┘
     │ POST /combine-epubs │ GET /api/saved-list
     │ (Merge view)        │ GET /api/saved-content
     │                     │ (Reader view, with Bearer token)
     │                     │
┌────▼─────────────────┐  ┌▼─────────────────────────────┐
│  EPUB Combiner API   │  │  Vercel Serverless Functions  │
│  (Render.com)        │  │  api/saved-list.js            │
│  Express.js          │  │  api/saved-content.js         │
│                      │  │                               │
│  GET  /config        │  │  Verify Google idToken via    │
│  GET  /health        │  │  oauth2.googleapis.com/       │
│  POST /combine-epubs │  │    tokeninfo                  │
└──────────────────────┘  │            │                  │
                          └────────────┼──────────────────┘
                                       │ Service role key
                          ┌────────────▼──────────────────┐
                          │  Supabase                     │
                          │  - articles table (Postgres)  │
                          │  - article-content (Storage)  │
                          └───────────────────────────────┘
```

---

## File Structure

```
merge-epubs/
├── index.html                        # All HTML structure for all three views
├── styles.css                        # All styles, CSS variables, responsive design
├── script.js                         # All application logic (state, routing, API, auth, edit, EPUB)
├── readeasy-postmessage-listener.js  # Standalone helper for extension integration
├── package.json                      # {"type":"module"} — enables ESM in api/ serverless functions
├── api/                              # Vercel serverless functions (Node.js runtime)
│   ├── saved-list.js                 # Lists current user's saved articles from Supabase
│   ├── saved-content.js              # Returns a signed URL for fetching one article's HTML
│   ├── articles.js                   # (Legacy/duplicate of saved-list — kept for compatibility)
│   ├── article-content.js            # (Legacy/duplicate of saved-content)
│   └── debug.js                      # Diagnostic endpoint for env-var visibility
├── INTEGRATION-combine-epub.md       # API integration examples in multiple languages
├── QUICK_START_AI.md                 # Quick-start cheat sheet for AI assistants
├── WEBAPP_POSTMESSAGE_README.md      # postMessage protocol for Chrome extension
├── README.md                         # User-facing project overview
├── CLAUDE.md                         # AI-assistant guidance file
└── doc/                              # Structured project documentation
    ├── architecture.md               # This file
    ├── sprint-2026-01.md             # January 2026 sprint log
    ├── sprint-2026-02.md             # February 2026 sprint log
    └── doc-template.md               # Templates for future sprint docs
```

---

## Code Structure

### index.html

**Purpose**: HTML structure and form elements for all three views.

**Key HTML sections**:
```html
<header>                  <!-- App title, subtitle, nav links, auth UI -->
<main>
  <div#mergeView>         <!-- Merge EPUBs tab -->
    <div#apiConfig>       <!-- API URL configuration + test connection -->
    <div.card>            <!-- Upload drag-drop area -->
    <div#fileList>        <!-- Uploaded files display -->
    <div#progressSection> <!-- Processing progress bar -->
    <div#resultSection>   <!-- Success message + download button -->
    <div#errorSection>    <!-- Error messages -->
  <div#readerView>        <!-- Reader View tab -->
    <div.reader-toolbar>  <!-- Theme toggle, font buttons, EPUB download -->
    <div#articleRoot>     <!-- Rendered article HTML -->
  <div#convertView>       <!-- Convert Text tab (auth-gated) -->
    <input#convertTitle>  <!-- Optional article title -->
    <textarea#convertInput><!-- Plain text input -->
</main>
```

**Important element IDs used in JavaScript**:

| ID | Purpose |
|----|---------|
| `apiUrl` | API endpoint input |
| `testConnection` | Test connection button |
| `connectionStatus` | API status message |
| `mergeView` | Merge tab container |
| `readerView` | Reader tab container |
| `convertView` | Convert tab container |
| `uploadArea` | Drag-drop zone |
| `epubFiles` | Hidden file input |
| `fileList` | File list container |
| `combineBtn` | Combine action button |
| `progressSection` | Progress bar container |
| `progressFill` | Progress bar fill element |
| `progressText` | Progress status text |
| `resultSection` | Success/download container |
| `downloadBtn` | Download combined EPUB button |
| `resetBtn` | Reset button |
| `errorSection` | Error container |
| `errorMessage` | Error text element |
| `retryBtn` | Retry button |
| `readerTitle` | Article title display |
| `readerByline` | Byline/site display |
| `readerSource` | Source URL link |
| `readerStatus` | Reader status message |
| `articleRoot` | Rendered article HTML container |
| `themeToggle` | Theme toggle button |
| `.font-btn` | Font size preset buttons |
| `downloadEpub` | Download article as EPUB button |
| `convertInput` | Plain text textarea |
| `convertTitle` | Article title input (convert) |
| `.nav-link[data-view="convert"]` | Convert nav tab (locked when logged out) |
| `googleSignIn` | Google sign-in button container |
| `logoutBtn` | Logout button |
| `authProfile` | Auth profile display area |
| `authAvatar` | User avatar `<img>` |
| `authName` | User display name |

---

### styles.css

**Purpose**: Responsive design and all styling.

**CSS Variables** — all colors and sizes are customised here:
```css
:root {
    --primary-color: #4f46e5;      /* Main brand color (Indigo) */
    --primary-hover: #4338ca;      /* Hover state */
    --success-color: #10b981;      /* Success messages (Green) */
    --error-color: #ef4444;        /* Error messages (Red) */
    --secondary-color: #6b7280;    /* Disabled/Secondary (Gray) */
    --background: #f9fafb;         /* Page background */
    --card-background: #ffffff;    /* Card background */
    --text-primary: #111827;       /* Main text */
    --text-secondary: #6b7280;     /* Secondary text */
    --border-color: #e5e7eb;       /* Borders */
    --reader-font-size: 18px;      /* Reader body font size (set via JS) */
}
```

**Responsive breakpoints**:
```css
@media (max-width: 640px) { /* Mobile — stack elements vertically, reduce padding */ }
```

**Key CSS classes**:

| Class | Purpose |
|-------|---------|
| `.card` | White container with shadow |
| `.btn-primary` | Indigo action button |
| `.btn-secondary` | Gray secondary button |
| `.file-item` | Individual file row in list |
| `.progress-bar` | Progress bar track |
| `.error-card` | Red error container |
| `.status-message` | Connection status display |
| `.nav-link.locked` | Convert tab when user is logged out |
| `.reader-toolbar` | Sticky toolbar in reader view |
| `.font-btn.active` | Currently selected font size button |

---

### script.js

**Purpose**: All application logic — state management, routing, event handling, API calls, auth, HTML sanitization, and client-side EPUB generation.

---

## State Management

All application state lives in plain JavaScript objects in `script.js`. No external state library.

### `state` — EPUB combiner state
```js
const state = {
  files: File[],          // EPUB files queued for combining
  apiUrl: string,         // API endpoint (configurable by user in UI)
  apiConfig: object|null, // {maxFiles, maxFileSize, maxFileSizeMB} from GET /config
  combinedBlob: Blob|null // Binary result after a successful combine
};
```

### `readerState` — Reader and convert state
```js
const readerState = {
  theme: 'light'|'dark'|'warm', // Current display theme (default: light)
  fontSize: number,             // Current font size in px (default: 18)
  currentArticle: object|null,  // Last received/converted article payload
  convertText: string,          // Text in the convert textarea (persists across tab switches)
  convertTitle: string          // Title in the convert title input
};
```

### `authState` — Google authentication state
```js
const authState = {
  isLoggedIn: boolean,
  profile: { name, email, picture }|null,
  idToken: string|null     // Raw Google JWT; persisted to localStorage under 'readeasy-auth';
                            // sent as `Authorization: Bearer …` to /api/saved-list and /api/saved-content
};
```

### `editorState` — Reader edit mode state
```js
const editorState = {
  active: boolean,                  // Edit mode toggle
  savedRange: Range|null,           // Cloned selection restored before execCommand calls
  snapshot: { html, title, byline }|null, // For Cancel rollback
  currentHlColor: string,           // Last-used highlight colour (default '#fef08a')
  currentFontColor: string,         // Last-used font colour (default '#ef4444')
  pendingImageDataUri: string|null, // Data URI from FileReader during image upload modal
  editingLink: HTMLAnchorElement|null // <a> being edited (pre-populated link modal)
};
```

### `paginationState` — Multi-chapter EPUB pagination
```js
const paginationState = {
  enabled: boolean,    // True only when current article was split into ≥2 pages
  pages: string[],     // Sanitized HTML per chapter — each rendered into #articleRoot on demand
  currentPage: number  // Zero-based index into pages[]
};
```

### `libraryState` — Supabase-backed saved-article library
```js
const libraryState = {
  articles: object[], // [{ id, title, url, site_name, added_date, content_path }]
  loaded: boolean,    // True once /api/saved-list has returned successfully
  loading: boolean,   // In-flight fetch flag (prevents duplicate loads on rapid sidebar toggle)
  error: string|null  // Last fetch error message, surfaced in the sidebar
};
```

### `readerConfig` — Static config (never mutated at runtime)
```js
const readerConfig = {
  allowedOrigins: string[], // Chrome extension IDs allowed to postMessage
  defaultTheme: 'light',
  defaultFontSize: 18
};
```

### `authConfig` — Static auth config
```js
const authConfig = {
  clientId: string  // Google OAuth 2.0 client ID
};
```

### Validation rules (inside `addFiles()`)
```javascript
// File count
if (state.files.length < 2)  → "At least 2 files required"
if (state.files.length > 10) → "Max 10 files allowed"

// File type
if (!file.name.toLowerCase().endsWith('.epub')) → "EPUB files only"

// File size (per file)
if (file.size > 52428800) → "File too large (50MB max)"  // 50 × 1024 × 1024

// Total size check is enforced by the API (100MB limit)
```

---

## DOM Elements Cache

All DOM references are cached once on startup in the `elements` object — no `getElementById` calls scattered through the code.

```javascript
const elements = {
  // API config
  apiUrlInput,          // Input for API URL
  testConnectionBtn,    // Test connection button
  connectionStatus,     // Status message div

  // Navigation
  navLinks,             // NodeList of .nav-link elements

  // Views
  mergeView,            // Merge EPUBs container
  readerView,           // Reader view container
  convertView,          // Convert Text container

  // Merge — upload
  uploadArea,           // Drag-drop zone
  fileInput,            // Hidden <input type="file">
  fileList,             // Files list container
  combineBtn,           // Combine action button

  // Merge — progress / result / error
  progressSection,      // Progress bar container
  progressFill,         // Progress bar fill element
  progressText,         // Progress status text
  resultSection,        // Success message container
  downloadBtn,          // Download combined EPUB button
  resetBtn,             // Reset button
  errorSection,         // Error container
  errorMessage,         // Error text element
  retryBtn,             // Retry button

  // Reader
  readerTitle,          // Article title
  readerByline,         // Byline / site name
  readerSource,         // Source URL <a>
  readerStatus,         // Status message in reader
  articleRoot,          // Article HTML container
  themeToggle,          // Dark/light theme toggle button
  fontButtons,          // NodeList of .font-btn elements
  downloadEpubBtn,      // Download article as EPUB button

  // Convert
  convertInput,         // Plain text <textarea>
  convertSubmit,        // Submit button
  convertTitle,         // Optional title input
  convertLink,          // Nav link for convert tab

  // Auth
  googleSignIn,         // Google sign-in button container
  logoutBtn,            // Logout button
  authProfile,          // Profile display area
  authAvatar,           // User <img> avatar
  authName              // User display name
};
```

---

## Core Functions Reference

### Initialization
```javascript
document.addEventListener('DOMContentLoaded', () => {
  // Sets default API URL, initialises theme/font,
  // loads auth from localStorage, wires all event listeners,
  // sets up hash routing, postMessage listener, Google auth, API test
  loadAuthState();
  setupEventListeners();
  setupRouting();
  setupReaderMessaging();
  setupGoogleAuth();
  testConnection();
});
```

### Routing
```javascript
setupRouting()          // Adds hashchange listener, triggers initial route
handleRouteChange()     // Reads hash, calls setActiveView()
getViewFromHash()       // Returns 'merge' | 'reader' | 'convert'
setActiveView(view)     // Shows/hides view divs, updates nav active states,
                        // triggers notifyExtensionReady() when reader is shown,
                        // redirects to #/reader if convert accessed while logged out
```

### Authentication
```javascript
setupGoogleAuth()           // Initialises GSI with retry (up to 10 × 300ms for script load)
initGoogleAuthWithRetry(n)  // Retry loop for GSI initialisation
handleGoogleCredential(res) // Decodes JWT, updates authState, saves to localStorage
handleLogout()              // Clears authState + localStorage, redirects if on convert
decodeJwtProfile(token)     // Base64-decodes JWT payload, returns {name, email, picture}
updateAuthUI()              // Shows/hides sign-in button, avatar, logout, convert lock
loadAuthState()             // Reads 'readeasy-auth' from localStorage on startup
saveAuthState()             // Persists {idToken, profile} to localStorage
clearAuthState()            // Resets authState + removes localStorage key
```

### Connection & API
```javascript
async testConnection()   // GET /config → updates connectionStatus, stores in state.apiConfig
async combineEpubs()     // Validates files, builds FormData, POST /combine-epubs,
                         // tracks progress, stores blob, shows result or error
```

### File Upload (Merge view)
```javascript
handleFileSelect(e)      // Triggered by <input type="file"> change event
handleDragOver(e)        // Adds .dragover class to upload area
handleDragLeave(e)       // Removes .dragover class
handleDrop(e)            // Extracts .epub files from dataTransfer, calls addFiles()
addFiles(newFiles)       // Validates type/size/count, pushes to state.files, updates UI
updateFileList()         // Renders state.files as .file-item elements with remove buttons
removeFile(index)        // Splices state.files, re-renders list
updateCombineButton()    // Enables button when ≥2 files; updates button label
downloadCombinedEpub()   // Creates object URL from state.combinedBlob, triggers download
resetUI()                // Clears state.files + combinedBlob, hides all sections
```

### Reader View
```javascript
setupReaderMessaging()   // Attaches window 'message' event listener
handleReaderMessage(e)   // Validates origin, checks payload type, calls renderReaderContent()
renderReaderContent(p)   // Populates title/byline/source, sanitizes + injects HTML,
                         // resets paginationState, paginates if payload.isEpub yields ≥2 pages,
                         // stores payload in readerState.currentArticle, enables download button
notifyExtensionReady()   // Sends 'readeasy-ready' to window.opener for handshake
setReaderStatus(msg, t)  // Updates #readerStatus element with message and CSS class
toggleReaderTheme()      // Cycles through light → dark → warm, calls setReaderTheme()
setReaderTheme(theme)    // Sets data-theme on <body>, updates toolbar label
setReaderFontSize(size)  // Sets --reader-font-size CSS var, marks active .font-btn
```

### Edit Mode
```javascript
enterEditMode()          // Snapshots current article state, marks fields contenteditable,
                         //   shows toolbar
exitEditMode(save)       // If save: commits new title/byline/html (paginated or single page).
                         //   If !save: restores from editorState.snapshot
saveSelection()          // Clones window.getSelection().getRangeAt(0) into editorState.savedRange
restoreSelection()       // Re-applies editorState.savedRange before each execCommand
applyEditCommand(cmd, v) // document.execCommand wrapper, used by toolbar buttons
insertImageFromUrl()     // Inserts <img src=…> at saved selection
insertImageFromFile()    // FileReader → data URI → <img>
insertLink() / editLink()// Link modal handlers; editLink targets editorState.editingLink
```

### EPUB Reader (local upload)
```javascript
async parseAndLoadEpub(file)
                         // JSZip the file, locate OPF via container.xml,
                         // build chapter list from manifest+spine, sanitize each chapter,
                         // rewrite asset URLs to Blob URLs, wrap each chapter in [data-rp],
                         // inject scoped CSS, then call renderReaderContent({ isEpub: true, … })
parseContainerXml(xml)   // Returns the OPF path
parseOpfXml(xml, opfDir) // Returns { manifest, spine } with linear="no" and nav docs filtered
extractEpubChapter(...)  // Sanitizes chapter XHTML and remaps asset references
sanitizeEpubHtml(html)   // Reader-side sanitizer for EPUB-uploaded content
injectEpubStyles(css)    // Inserts a <style id="epub-styles"> tag scoped to .reader-content
removeEpubStyles()       // Removes the injected <style> tag when a non-EPUB payload arrives
scopeEpubCss(css, scope) // Prefixes each rule selector with `scope` to prevent CSS leakage
```

### Pagination
```javascript
splitIntoPages(html)     // Returns string[] of [data-rp] wrappers; null if <2 found
setupPagination(pages)   // Enables paginationState, renders page 0
renderPage(idx)          // Swaps #articleRoot.innerHTML, scrolls to top, rebuilds bars
buildPaginationHtml(c,t) // Returns Prev / page numbers (current ±2, first, last, …) / Next
goToPage(idx)            // Auto-saves edit mode if active, then renderPage(idx)
hidePaginationBars()     // Hides both bars when a non-paginated payload arrives
```

### Library Sidebar
```javascript
openSidebar()/closeSidebar()/toggleSidebar()  // UI visibility + lazy first-load trigger
async loadLibrary()        // Calls fetchSupabaseArticles(), updates libraryState
async fetchSupabaseArticles()
                           // GET /api/saved-list with Bearer idToken
async fetchSignedUrl(path) // GET /api/saved-content?content_path=…
async openArticleFromLibrary(article)
                           // Fetches signed URL, extracts <body>, calls renderReaderContent()
renderSidebarArticles(a)   // Renders the list of <button.sidebar-article> entries
setupLibraryEventListeners()
```

### HTML Sanitization
```javascript
sanitizeArticleHtml(html, sourceUrl)
  // Removes: script, iframe, object, embed, form, input, button, link, meta
  // Removes: on* attributes, style attributes, javascript: URLs
  // Resolves: relative href/src/srcset URLs against sourceUrl

escapeHtml(text)         // Escapes & < > " ' for safe text content
```

### Convert Text
```javascript
handleConvertSubmit()           // Reads textarea + title, calls convertPlainTextToHtml(),
                                // builds readeasy-article payload, calls renderReaderContent(),
                                // navigates to #/reader
convertPlainTextToHtml(text)    // Escapes HTML, splits on double newlines, wraps in <p> tags
updateConvertSubmitState()      // Enables/disables submit button based on textarea content
```

### Client-Side EPUB Generation
```javascript
async downloadAsEpub()    // Fetches images, builds ZIP with JSZip, triggers download
convertToXhtml(html)      // Makes HTML XHTML-compliant: self-closes void elements,
                          // strips event handlers/data-*/style attrs, escapes entities
escapeXml(text)           // Escapes & < > " ' for XML/XHTML attributes
generateUuid()            // Produces a random RFC 4122 UUID for EPUB uid
```

### Utilities
```javascript
showError(message)        // Displays error in #errorSection, auto-dismisses after 5s
formatFileSize(bytes)     // Returns human-readable string: "5.2 MB", "800 KB", etc.
```

---

## Routing

Hash-based client-side routing. No router library — ~10 lines of code.

| Hash | View shown | Auth required |
|------|-----------|---------------|
| `#/merge` (default) | Merge EPUBs | No |
| `#/reader` | Reader View | No |
| `#/convert` | Convert Text | Yes — redirects to `#/reader` if logged out |

`handleRouteChange()` is called on every `hashchange` event and on initial page load.

---

## Authentication

Uses **Google Identity Services (GSI)** — the Google-hosted JavaScript library renders the sign-in button directly into `#googleSignIn`.

**Flow**:
1. Page loads → `loadAuthState()` reads `readeasy-auth` from `localStorage`
2. `setupGoogleAuth()` initialises GSI with client ID; retries up to 10 times (300 ms apart) to handle script load race conditions
3. On sign-in: `handleGoogleCredential()` decodes the JWT payload with `atob()`, extracts `name`, `email`, `picture`, saves to `authState` and `localStorage`
4. On logout: `handleLogout()` clears `authState` and `localStorage`, redirects to `#/reader`

**Google Client ID**: `1013859959230-hfo0mohq8c02hkea0v56rshdv660b2qp.apps.googleusercontent.com`

**Important**: The `idToken` is decoded client-side with `atob()` to populate the UI, and is stored in `localStorage`. For the Library sidebar, it is also sent as `Authorization: Bearer …` to `/api/saved-list` and `/api/saved-content`, where the Vercel function verifies it against `https://oauth2.googleapis.com/tokeninfo` and uses the `sub` claim to scope Supabase queries to the caller. The Convert tab itself is still gated client-side only.

**UI states**:
- Logged out: Google sign-in button visible; convert tab shows lock icon and is non-interactive
- Logged in: Avatar + name visible; logout button visible; sign-in button hidden; convert tab unlocked

---

## Features Breakdown

### 1. Merge EPUBs

#### Drag & Drop Upload
**Functions**: `handleDragOver()`, `handleDragLeave()`, `handleDrop()`

Flow: user drags files over upload area → visual border highlight (`.dragover` class) → drop → `addFiles()` validates and stores → file list renders.

#### File Validation
**Function**: `addFiles()`

- `.epub` extension required
- Max 50 MB per file (52,428,800 bytes)
- 2–10 files total
- API enforces 100 MB total upload cap

#### Real-Time Progress
**Function**: `combineEpubs()`

```
30%  → "Uploading files..."
60%  → "Combining EPUBs..."
90%  → "Processing..."
100% → "Complete!"
```

Progress bar hides and result section appears 500 ms after completion.

#### API Configuration
**Function**: `testConnection()`

Users can change the API URL in the UI. The app fetches `/config` on load and again when "Test Connection" is clicked. Displays limits (max files, max size, total cap) in the status bar.

#### Error Handling
**Function**: `showError()`

Handles: network errors, HTTP 4xx/5xx, validation errors (type/size), response parsing failures. Errors auto-dismiss after 5 seconds. A retry button resets the UI.

---

### 2. Reader View

**Functions**: `setupReaderMessaging()`, `handleReaderMessage()`, `renderReaderContent()`

The Chrome extension (ReadEasy) opens `https://merge-epubs.vercel.app/#/reader` and sends article HTML via `window.postMessage`.

**Handshake flow**:
```
Extension opens /#/reader in new tab
         ↓
Web app sends 'readeasy-ready' to window.opener
         ↓
Extension sends { type: 'readeasy-article', title, byline, siteName, sourceUrl, html }
         ↓
App validates origin → sanitizes HTML → renders into #articleRoot
```

**Allowed origins**:
```
chrome-extension://floidkamdcekmpimibhckjfegjpgeeda
chrome-extension://ffjopfamcpefiadpmnaoonhidikfdkif
```

**Reader toolbar**:
- Theme cycler: light → dark → warm → light (light is default; warm uses sepia tones for long-form reading)
- Font size presets: 16, 18, 20, 22 px
- Upload EPUB button (loads a local EPUB into the reader via `parseAndLoadEpub()`)
- Library button (opens the Supabase-backed saved-articles sidebar; visible when signed in)
- Edit button (toggles in-place editing of title, byline, and article body)
- Download EPUB button (disabled until content is loaded)

**HTML sanitization** (`sanitizeArticleHtml`):
- Removes: `script`, `iframe`, `object`, `embed`, `form`, `input`, `button`, `link`, `meta`
- Removes all `on*` event handler attributes and `style` attributes
- Removes `javascript:` URLs from `href`/`src`
- Resolves relative `href`, `src`, and `srcset` URLs against `sourceUrl`

---

### 3. Client-Side EPUB Generation

**Function**: `downloadAsEpub()`

Builds a valid EPUB 2.0 file in the browser using **JSZip**. Works for both reader articles and converted text.

**Steps**:
1. Parse article HTML; find all `<img>` tags with `http(s)://` `src`
2. `fetch()` each image, embed in ZIP at `OEBPS/images/img{n}.{ext}`; fails gracefully if unreachable
3. Build `mimetype` (uncompressed, must be first), `META-INF/container.xml`, `OEBPS/content.opf`, `OEBPS/toc.ncx`, `OEBPS/content.xhtml`
4. Run `convertToXhtml()`: self-close void elements (`<br />`, `<img />`), strip event handlers/data-*/style attrs, escape `&nbsp;` → `&#160;`, escape bare `&`
5. `zip.generateAsync({type: 'blob', compression: 'DEFLATE'})` → trigger browser download

**EPUB structure produced**:
```
article.epub/
├── mimetype
├── META-INF/container.xml
└── OEBPS/
    ├── content.opf
    ├── toc.ncx
    ├── content.xhtml
    └── images/
        ├── img0.jpg
        └── img1.png
```

Filename is sanitized from the article title (alphanumeric + spaces/hyphens, max 50 chars).

---

### 4. Convert Text

**Functions**: `handleConvertSubmit()`, `convertPlainTextToHtml()`

Accessed via `#/convert` (requires Google login).

1. User types/pastes text into `<textarea#convertInput>` (optional title in `#convertTitle`)
2. `convertPlainTextToHtml()` escapes HTML entities, splits on double newlines, wraps in `<p>` tags
3. Produces a `readeasy-article` payload, calls `renderReaderContent()` directly (no network, no extension)
4. Navigates to `#/reader` to display result
5. Download EPUB button is available from the reader toolbar

`readerState.convertText` and `readerState.convertTitle` persist input values across tab switches so the user doesn't lose work.

---

### 5. Edit Mode (Reader)

**Functions**: `enterEditMode()`, `exitEditMode(save)`, `setupEditEventListeners()`

Toggling Edit mode makes the article title, byline, and body `contenteditable` and reveals a formatting toolbar. Formatting is applied with `document.execCommand` (bold/italic/underline, lists, font size, font colour, highlight) plus custom handlers for inserting horizontal rules, footnotes, links, and images (URL or local file → data URI).

State machine:
1. `enterEditMode()` snapshots `{ html, title, byline }` into `editorState.snapshot`
2. User edits → `editorState.savedRange` tracks the last selection so toolbar buttons can restore it before each `execCommand`
3. Save → snapshot is committed back into `readerState.currentArticle.html/title/byline` (or, when pagination is active, into the current page slot of `paginationState.pages`)
4. Cancel → DOM is restored from `editorState.snapshot`

---

### 6. EPUB Reader (local upload)

**Functions**: `parseAndLoadEpub(file)`, `parseContainerXml()`, `parseOpfXml()`, `extractEpubChapter()`, `sanitizeEpubHtml()`, `injectEpubStyles()`, `scopeEpubCss()`

The Upload EPUB button accepts a local `.epub` file. JSZip unzips it; the `META-INF/container.xml` is parsed to locate the OPF; the OPF manifest + spine determine the chapter order. Each XHTML chapter is sanitized, its asset URLs are rewritten to point at Blob URLs created from the ZIP, and chapter HTML is wrapped in a `<div data-rp="chapter">` element. EPUB-bundled CSS is scoped to `.reader-content` via `scopeEpubCss()` and injected into `<head>` so chapter styling renders without leaking into the rest of the app.

Filtering rules (added 2026-05-25 to fix duplicate-page bugs):
- Skip nav documents (`properties="nav"` in OPF manifest)
- Skip non-linear spine entries (`linear="no"`)
- De-duplicate by resolved file path so the same file referenced twice doesn't render twice

---

### 7. Pagination (Reader)

**Functions**: `splitIntoPages()`, `setupPagination()`, `renderPage()`, `buildPaginationHtml()`, `getPageNumbers()`, `goToPage()`, `hidePaginationBars()`

When `renderReaderContent()` receives an article with `isEpub: true`, it parses the sanitized HTML and looks for top-level `[data-rp]` wrappers (one per chapter). If two or more are found, pagination engages:
- `paginationState.pages[]` holds one chapter HTML string per page
- Top and bottom `.pagination-bar` rows show Prev/Next plus first/last/current ±2 page numbers with `…` ellipses
- Clicking a page number swaps `#articleRoot.innerHTML` to that page's string and scrolls the reader to top
- If Edit mode is active when navigating, the current page's edits are auto-saved into `paginationState.pages` first

The `[data-rp]` attribute is owned by the reader's own EPUB wrapping step — EPUB content cannot accidentally contain it, so the selector never matches author-owned divs.

---

### 8. Library Sidebar (Reader)

**Functions**: `openSidebar()`, `closeSidebar()`, `toggleSidebar()`, `loadLibrary()`, `fetchSupabaseArticles()`, `fetchSignedUrl()`, `openArticleFromLibrary()`, `renderSidebarArticles()`, `setupLibraryEventListeners()`

Signed-in users see a Library button in the reader toolbar. Clicking it opens a sidebar listing their saved articles fetched from Supabase via `/api/saved-list`. Clicking an article calls `/api/saved-content` to obtain a 1-hour signed URL, fetches the HTML directly from Supabase Storage, extracts `<body>`, and feeds it through `renderReaderContent()` as a non-EPUB payload. On screens ≤ 640 px wide the sidebar auto-closes after opening an article to free up reading space.

The list is fetched lazily on first sidebar open; subsequent opens reuse `libraryState.articles`. The Refresh button forces a re-fetch by flipping `libraryState.loaded = false`.

---

## API Integration

### Endpoints (EPUB Combiner API)

**GET /config** — called on load and on "Test Connection"
```javascript
fetch(`${state.apiUrl}/config`)
```
Response:
```json
{
  "maxFiles": 10,
  "maxFileSize": 52428800,
  "maxFileSizeMB": 50,
  "port": 3000
}
```

**GET /health** — liveness check
```json
{ "status": "ok", "message": "EPUB Combiner API is running" }
```

**POST /combine-epubs** — main operation
```javascript
const formData = new FormData();
state.files.forEach(file => formData.append('epubs', file));
fetch(`${state.apiUrl}/combine-epubs`, { method: 'POST', body: formData });
```
- Success 200: binary EPUB (`Content-Type: application/epub+zip`)
- Error 400–500: `{ "error": "...", "message": "...", "details": "..." }`

**API error codes**:

| Status | Meaning |
|--------|---------|
| 400 | No files / fewer than 2 files / more than 10 files / file too large / non-EPUB file |
| 500 | Processing failed server-side |

### Library API (Vercel serverless, same origin)

These two endpoints back the Library sidebar in the Reader view. Both require a valid Google ID token in `Authorization: Bearer …`; the function verifies it against `https://oauth2.googleapis.com/tokeninfo` and uses the `sub` claim as `google_uid` for row scoping.

**GET /api/saved-list** — returns the signed-in user's saved articles
```javascript
fetch('/api/saved-list', { headers: { Authorization: 'Bearer ' + idToken } })
```
Response (array, ordered by `added_date desc`):
```json
[
  {
    "id": "uuid",
    "title": "Article Title",
    "url": "https://source.example/article",
    "site_name": "Source",
    "added_date": "2026-05-20T12:34:56Z",
    "content_path": "<google_uid>/<article>.html"
  }
]
```

**GET /api/saved-content?content_path=…** — returns a 1-hour Supabase Storage signed URL for one article
```javascript
fetch('/api/saved-content?content_path=' + encodeURIComponent(article.content_path),
      { headers: { Authorization: 'Bearer ' + idToken } })
```
Response:
```json
{ "signedUrl": "https://pcyjafpopnjtjqaelycy.supabase.co/storage/v1/object/sign/article-content/…" }
```

**Library API error codes**:

| Status | Meaning |
|--------|---------|
| 401 | Missing/invalid/expired Google ID token |
| 403 | `content_path` does not start with caller's `google_uid` (cross-user access blocked) |
| 400 | Missing or unsafe `content_path` (contains `..` or starts with `/`) |
| 500 | Server missing `SUPABASE_SERVICE_ROLE_KEY` env var |
| 502 | Upstream Supabase error |

**Required Vercel env var**: `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role secret. Stored as a non-Sensitive env var because Vercel's bundler skips Sensitive vars during module-level reads (see sprint log).

### postMessage Payload (Reader View)

```js
{
  type: 'readeasy-article',
  title: string,
  byline: string,
  siteName: string,
  sourceUrl: string,
  html: string
}
```

---

## File Processing Flow

### Client-side (Merge view)

```
User selects / drops files
         ↓
addFiles() — validate type, size, count
         ↓
state.files updated, file list re-rendered
         ↓
User clicks "Combine N EPUBs"
         ↓
combineEpubs() — builds FormData, shows progress bar
         ↓
POST /combine-epubs → progress: 30% → 60% → 90%
         ↓
Response blob received → progress: 100%
         ↓
state.combinedBlob set, result section shown
         ↓
User clicks Download → downloadCombinedEpub()
```

### Server-side (Render API)

```
Receive POST with multipart EPUB files
         ↓
Parse multipart form data
         ↓
For each EPUB:
  - Unzip
  - Extract content.opf (metadata, book title/author)
  - Extract chapter XHTML + images + styles + fonts
         ↓
Merge all EPUBs:
  - Prefix filenames: chapter_N_*, img_N_*, style_N_*, font_N_*
  - Combine manifest and spine entries
  - Generate toc.xhtml (HTML TOC page, first in spine)
         ↓
Repack into new EPUB ZIP
         ↓
Stream binary back as application/epub+zip
```

---

## Performance & Limits

### Upload limits

| Setting | Value | Reason |
|---------|-------|--------|
| Max files | 10 | API limit |
| Max per file | 50 MB | Render free tier RAM |
| Max total | 100 MB | API configured limit |
| Processing timeout | 5 minutes | Render function timeout |

### Render free tier memory

```
Total RAM: 512 MB
Node.js base: ~80 MB
Available for processing: ~432 MB

Peak usage: 3–4× file size in RAM
→ 100 MB upload needs 300–400 MB RAM (exceeds safe margin)
→ Realistic safe max: 30–50 MB total upload
```

### Performance metrics

| Operation | Time | Notes |
|-----------|------|-------|
| UI load | 1–2s | Vercel edge network |
| File upload | 5–30s | Network speed dependent |
| EPUB processing | 10–30s | File count and complexity |
| Client-side EPUB generation | 2–10s | Image download time |
| Download | <5s | Browser download |

---

## Development Guide

### Adding a new feature — template

1. **HTML** — add elements with IDs in `index.html`
2. **Cache** — add to `elements` object in `script.js`
3. **State** — add fields to the appropriate state object if needed
4. **Function** — write the handler; read from state, update state, call UI update functions
5. **Wire up** — add event listener in `setupEventListeners()`

**Example: file reordering**

```html
<!-- index.html -->
<button class="file-move-up" data-index="${index}">↑</button>
<button class="file-move-down" data-index="${index}">↓</button>
```

```javascript
// script.js
function moveFileUp(index) {
  if (index > 0) {
    [state.files[index], state.files[index - 1]] =
      [state.files[index - 1], state.files[index]];
    updateFileList();
  }
}

// in setupEventListeners():
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('file-move-up')) {
    moveFileUp(parseInt(e.target.dataset.index));
  }
});
```

### Testing locally

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

Useful browser console snippets:
```javascript
// Inspect current state
console.log('state:', state);
console.log('readerState:', readerState);
console.log('authState:', authState);

// Debug file sizes
state.files.forEach(f => console.log(f.name, formatFileSize(f.size)));

// Test API directly
fetch('https://epub-combiner-api.onrender.com/config').then(r => r.json()).then(console.log);

// Simulate a postMessage from extension (for reader testing)
window.dispatchEvent(new MessageEvent('message', {
  origin: 'chrome-extension://floidkamdcekmpimibhckjfegjpgeeda',
  data: { type: 'readeasy-article', title: 'Test', byline: '', siteName: '', sourceUrl: '', html: '<p>Hello</p>' }
}));
```

### Hard refresh (clear browser cache)
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`

---

## Deployment Guide

### Frontend — Vercel

**Steps**:
1. Connect GitHub repo (`pulkitv/merge-epubs`) to Vercel
2. Set production branch: `main`
3. No build command needed — static files only
4. Deploy; Vercel auto-deploys on every push to `main`

No `vercel.json` required (was removed Feb 2026 after proxy was dropped).

### Backend — Render

**Steps**:
1. Create a Web Service on Render
2. Connect to the API GitHub repo
3. Set start command: `npm start`
4. Set environment variables:
   ```
   NODE_ENV=production
   PORT=3000
   ```
5. Deploy

**Note**: Free tier instances sleep after ~15 minutes of inactivity. The first request after sleep can take 20–30 seconds.

---

## Security

- **postMessage origin validation**: only two known Chrome extension IDs are accepted; all other origins are silently ignored
- **HTML sanitization**: `sanitizeArticleHtml()` runs before any extension-provided HTML is injected into the DOM — prevents XSS. A separate `sanitizeEpubHtml()` runs on EPUB-uploaded chapter content before injection in the reader, and `convertToXhtml()` runs before HTML is embedded into a downloaded EPUB.
- **XHTML conversion**: `convertToXhtml()` strips all event handlers, `style`, and `data-*` attributes before embedding HTML into EPUB
- **Google JWT validation**:
  - Client-side: decoded with `atob()` to display the user's name/avatar (no signature check)
  - Server-side: `/api/saved-list` and `/api/saved-content` verify every request against `https://oauth2.googleapis.com/tokeninfo`; the verified `sub` claim is used as `google_uid` to scope Supabase queries
- **Cross-user content access blocked**: `/api/saved-content` rejects any `content_path` that does not begin with the caller's verified `google_uid` (HTTP 403), and also rejects paths containing `..` or starting with `/` (HTTP 400)
- **Supabase signed URLs**: storage objects are private; the API returns a per-request signed URL with `expiresIn: 3600`
- **File storage**: combiner API stores nothing server-side — it processes in memory and streams the result back immediately
- **No analytics, no data collection**

---

## Troubleshooting

### "Failed to fetch" when combining

Causes: API server asleep (free tier), network error, CORS misconfigured, file too large.

```javascript
// Check API health in browser console
fetch('https://epub-combiner-api.onrender.com/config')
  .then(r => r.json())
  .then(console.log)
  .catch(e => console.error('API Error:', e));

// Check total file size
console.log('Total size:', state.files.reduce((sum, f) => sum + f.size, 0));
```

If the first request after a long idle period takes ~30s, that is expected (Render free tier cold start).

---

### Vercel shows old code

```bash
# Force Vercel redeploy
git commit --allow-empty -m "Force redeploy"
git push
```

---

### API response too large / out of memory

Causes: combined EPUB exceeds Render free tier RAM (realistically ~50 MB total input is the safe cap).

Solutions:
1. Reduce number or size of files
2. Upgrade to Render paid plan for 2 GB+ RAM
3. Implement server-side streaming to reduce peak memory usage

---

### postMessage not received in reader view

1. Check that `window.opener` is non-null in the extension (the reader must have been opened by the extension, not navigated to directly)
2. Verify the extension origin matches one of the two allowed IDs in `readerConfig.allowedOrigins`
3. Open DevTools console on the reader tab — all received messages and origin validation results are logged

---

### Google sign-in button doesn't render

The GSI library is loaded asynchronously. `setupGoogleAuth()` retries up to 10 × 300 ms. If it still fails, check:
1. The Google client ID in `authConfig.clientId` is correct
2. The domain is listed as an authorised JavaScript origin in Google Cloud Console

---

## Known Constraints & Future Work

- Render free tier RAM limits realistic safe max to ~30–50 MB total upload (not the documented 100 MB ceiling)
- No file reordering UI in the merge view (drag-to-sort not yet implemented)
- The Convert tab itself is still gated client-side only; the server-side gate only applies to the Library API
- EPUB download from reader fetches images at download time; fails gracefully if image is unreachable but may be slow on image-heavy articles
- Free tier Render instances sleep after inactivity — cold start adds ~20–30s to first request
- `SUPABASE_SERVICE_ROLE_KEY` must be a regular (non-Sensitive) Vercel env var — Sensitive vars are stripped by Vercel's bundler during module-level reads and the functions then return 500
- Duplicate API files (`api/articles.js`, `api/article-content.js`) exist alongside the canonical `api/saved-list.js` / `api/saved-content.js`; only the saved-* pair is wired into the frontend

See the sprint logs in `doc/` for planned work and carry-overs.

---

## Important Files Reference

| File | Purpose |
|------|---------|
| `index.html` | HTML structure for all three views |
| `styles.css` | All styling, CSS variables, responsive design |
| `script.js` | All frontend logic — state, API calls, auth, reader, edit mode, EPUB parsing, pagination, library |
| `readeasy-postmessage-listener.js` | Standalone postMessage helper for extension integration |
| `package.json` | `{"type":"module"}` — enables ESM in `api/` serverless functions |
| `api/saved-list.js` | Vercel function: returns the signed-in user's saved articles from Supabase |
| `api/saved-content.js` | Vercel function: returns a 1-hour signed URL for a single article's content |
| `api/articles.js` / `api/article-content.js` | Legacy duplicates of the saved-* pair |
| `api/debug.js` | Diagnostic endpoint for env-var visibility |
| `CLAUDE.md` | AI-assistant guidance file (project conventions, key files, hot paths) |
| `INTEGRATION-combine-epub.md` | API integration examples (JS, Node, Python, PHP, Ruby) |
| `QUICK_START_AI.md` | 30-second cheat sheet for AI coding assistants |
| `WEBAPP_POSTMESSAGE_README.md` | postMessage protocol spec for Chrome extension |
| `README.md` | User-facing setup and usage guide |
| `doc/architecture.md` | This file — full technical reference |
| `doc/sprint-2026-01.md` | January 2026 sprint log |
| `doc/sprint-2026-02.md` | February 2026 sprint log |
| `doc/doc-template.md` | Documentation conventions and sprint template |
