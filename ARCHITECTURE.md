# EPUB Combiner - Architecture & Technical Documentation

**Project**: EPUB Combiner UI  
**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: 2 February 2026

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Code Structure](#code-structure)
4. [Key Variables & State Management](#key-variables--state-management)
5. [Features Breakdown](#features-breakdown)
6. [API Integration](#api-integration)
7. [File Processing Flow](#file-processing-flow)
8. [Performance & Limits](#performance--limits)
9. [Development Guide](#development-guide)
10. [Deployment Guide](#deployment-guide)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

### Purpose
Web-based application to combine multiple EPUB files into a single EPUB file with automatic table of contents generation.

Additionally, the app includes a **Reader View** that receives HTML content via `postMessage` from a Chrome extension and renders it in a clean, readable format.

### Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Hosting**: Vercel (Static site hosting)
- **Backend**: Express.js/Node.js
- **API Hosting**: Render.com
- **File Format**: EPUB (ZIP-based)
- **Extension Integration**: Chrome extension `postMessage` to Reader View

### Key Metrics
- **Frontend Size**: ~50KB (HTML + CSS + JS)
- **Max Upload**: 100MB total (10 files × 50MB max each)
- **Processing Time**: 10-30 seconds for typical jobs
- **API Response**: <5 seconds for most operations

---

## 🏗️ Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   User Browser                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  EPUB Combiner UI (Vercel)                      │   │
│  │  - index.html (structure)                       │   │
│  │  - styles.css (design)                          │   │
│  │  - script.js (logic)                            │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (Direct API Calls)
                       │
┌──────────────────────▼──────────────────────────────────┐
│         EPUB Combiner API (Render)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Express.js Server                               │   │
│  │  - GET /config (returns limits)                  │   │
│  │  - GET /health (health check)                    │   │
│  │  - POST /combine-epubs (main endpoint)           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Uploads Files
        ↓
Browser Validates (size, count, type)
        ↓
FormData Created (multipart/form-data)
        ↓
POST to API (/combine-epubs)
        ↓
Server Processes:
  - Unzip EPUB files
  - Extract metadata
  - Merge content
  - Generate TOC
  - Create new EPUB
        ↓
Return Binary EPUB (Content-Type: application/epub+zip)
        ↓
Browser Downloads File
```

---

## 📁 Code Structure

### index.html
**Purpose**: HTML structure and form elements

**Key Sections**:
```html
<header>              <!-- Title and subtitle -->
<main>
  <div#apiConfig>     <!-- API URL configuration -->
  <div.card           <!-- Upload section -->
  <div#fileList>      <!-- Uploaded files display -->
  <div#progressSection><!-- Processing progress bar -->
  <div#resultSection> <!-- Success message + download -->
  <div#errorSection>  <!-- Error messages -->
</main>
```

**Important IDs Used in JavaScript**:
- `apiUrl` - API endpoint input
- `epubFiles` - File input element
- `fileList` - Container for uploaded files
- `combineBtn` - Combine button
- `progressSection` - Progress container
- `resultSection` - Success/download container
- `errorSection` - Error container
- `mergeView` - Merge EPUBs view container
- `readerView` - Reader view container
- `readerTitle` - Article title display
- `readerByline` - Byline/site display
- `readerSource` - Source URL link
- `readerStatus` - Reader status message
- `articleRoot` - Reader HTML content container
- `themeToggle` - Theme toggle button
- `.font-btn` - Font size buttons

---

### styles.css
**Purpose**: Responsive design and styling

**CSS Variables** (Customization Points):
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
}
```

**Responsive Breakpoints**:
```css
@media (max-width: 640px) { /* Mobile */
    /* Stack elements vertically */
    /* Reduce padding/margins */
}
```

**Key Classes**:
- `.card` - White container with shadow
- `.btn-primary` - Blue action buttons
- `.btn-secondary` - Gray secondary buttons
- `.file-item` - Individual file in list
- `.progress-bar` - Upload progress indicator
- `.error-card` - Red error container
- `.status-message` - Connection status display

---

### script.js
**Purpose**: Application logic, state management, API integration

#### Global State Object

```javascript
const state = {
    files: [],                                    // Array of File objects
    apiUrl: 'https://epub-combiner-api.onrender.com',  // API endpoint
    apiConfig: null,                              // {maxFiles, maxFileSize, maxFileSizeMB}
    combinedBlob: null                            // Binary EPUB data after combining
};

const readerConfig = {
   allowedOrigins: [
      'chrome-extension://floidkamdcekmpimibhckjfegjpgeeda',
      'chrome-extension://ffjopfamcpefiadpmnaoonhidikfdkif'
   ],
   defaultTheme: 'dark',
   defaultFontSize: 18
};

const readerState = {
   theme: readerConfig.defaultTheme,
   fontSize: readerConfig.defaultFontSize
};
```

#### DOM Elements Cache

```javascript
const elements = {
    apiUrlInput,        // Input for API URL
    testConnectionBtn,  // Test connection button
    connectionStatus,   // Status message div
    uploadArea,         // Drag-drop zone
    fileInput,          // Hidden file input
    fileList,           // Files container
    combineBtn,         // Combine action button
    progressSection,    // Progress bar container
    progressFill,       // Progress bar fill element
    progressText,       // Progress status text
    resultSection,      // Success message container
    downloadBtn,        // Download button
    resetBtn,           // Reset button
    errorSection,       // Error message container
    errorMessage,       // Error text
    retryBtn            // Retry button
};
```

#### Core Functions

**Initialization**
```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Set default API URL
    // Cache DOM elements
    // Setup event listeners
    // Test API connection
});
```

**Connection Management**
```javascript
async function testConnection()
    // Fetch API config endpoint
    // Update connection status
    // Store config in state.apiConfig
```

**File Upload**
```javascript
function handleFileSelect(e)          // File input change
function handleDragOver(e)            // Drag enter
function handleDragLeave(e)           // Drag exit
function handleDrop(e)                // File drop
function addFiles(newFiles)           // Add files to state
    // Validate: file type (.epub)
    // Validate: file size (50MB max)
    // Validate: total count (10 max)
    // Store in state.files
    // Update UI
```

**File Management**
```javascript
function updateFileList()             // Render files with remove buttons
function removeFile(index)            // Remove file from state
function updateCombineButton()        // Enable/disable combine button
```

**Combining**
```javascript
async function combineEpubs()
    // Validate at least 2 files
    // Create FormData with all files
    // POST to API endpoint
    // Track progress (visual feedback)
    // Handle response (blob)
    // Show success/error
```

**Download & Reset**
```javascript
function downloadCombinedEpub()       // Trigger browser download
function resetUI()                    // Clear files and hide sections
```

**Utilities**
```javascript
function showError(message)           // Display error for 5 seconds
function formatFileSize(bytes)        // Convert bytes to human-readable format (e.g., "5.2 MB")
```

---

## 🔑 Key Variables & State Management

### State Object Structure

| Variable | Type | Purpose | Example |
|----------|------|---------|---------|
| `state.files` | File[] | Uploaded files waiting to combine | `[File, File, File]` |
| `state.apiUrl` | string | Current API endpoint | `"https://epub-combiner-api.onrender.com"` |
| `state.apiConfig` | object | API configuration from server | `{maxFiles: 10, maxFileSize: 52428800, ...}` |
| `state.combinedBlob` | Blob | Binary data of combined EPUB | `Blob {size: 1234567, type: "application/epub+zip"}` |

### Important Validation Rules

```javascript
// File count validation
if (state.files.length < 2) → "At least 2 files required"
if (state.files.length > 10) → "Max 10 files allowed"

// File type validation
if (!file.name.toLowerCase().endsWith('.epub')) → "EPUB files only"

// File size validation
if (file.size > 52428800) → "File too large (50MB max)"

// Total upload validation
if (totalSize > 104857600) → "Total exceeds 100MB limit"
```

---

## ✨ Features Breakdown

### 1. Drag & Drop Upload
**File**: `script.js` functions `handleDragOver()`, `handleDragLeave()`, `handleDrop()`

**Flow**:
1. User drags files over upload area
2. Visual feedback (border highlight)
3. User drops files
4. `addFiles()` validates and stores
5. File list updates

**Key Code**:
```javascript
elements.uploadArea.addEventListener('dragover', handleDragOver);
elements.uploadArea.addEventListener('drop', handleDrop);
```

---

### 2. File Validation
**File**: `script.js` function `addFiles()`

**Validations**:
- ✅ File extension (.epub only)
- ✅ File size (each < 50MB)
- ✅ File count (2-10 files)
- ✅ Total size (< 100MB)

**Error Handling**: Shows error message, prevents upload if invalid

---

### 3. Real-time Progress Tracking
**File**: `script.js` function `combineEpubs()`

**Progress Stages**:
```
30% → File upload started
60% → Files received, combining in progress
90% → Processing complete, preparing download
100% → Ready to download
```

**Implementation**:
```javascript
elements.progressFill.style.width = '30%';
elements.progressText.textContent = 'Uploading files...';
```

---

### 4. API Configuration
**File**: `script.js` function `testConnection()`

**Features**:
- Custom API URL input
- Connection testing before upload
- Displays max files, file size, total limit
- Caches config for UI reference

---

### 5. Error Handling
**File**: `script.js` function `showError()`

**Error Types Handled**:
- Network errors (connection failed)
- HTTP errors (413, 502, etc.)
- Validation errors (file type, size)
- Response parsing errors

---

### 6. Reader View (postMessage)
**File**: `script.js` functions `setupReaderMessaging()`, `handleReaderMessage()`, `renderReaderContent()`

**Flow**:
1. User opens `/#/reader`
2. Web app sends `readeasy-ready` to `window.opener`
3. Extension sends payload via `postMessage`
4. App validates origin and payload type
5. Sanitizes HTML and renders to `#articleRoot`
6. Displays metadata (title/byline/source) and enables reader tools

**Toolbar Tools**:
- Theme toggle (default dark)
- Font size presets: 16, 18, 20, 22

**Security**:
- Allowed origins only (two extension IDs)
- Sanitizes HTML (removes scripts/iframes and unsafe attributes)

---

## 🔗 API Integration

### Endpoints Called

**1. Test Connection: GET /config**
```javascript
fetch(`${state.apiUrl}/config`)
```

**Response**:
```json
{
  "maxFiles": 10,
  "maxFileSize": 52428800,
  "maxFileSizeMB": 50,
  "port": 3000
}
```

**2. Combine EPUBs: POST /combine-epubs**
```javascript
fetch(`${state.apiUrl}/combine-epubs`, {
  method: 'POST',
  body: formData  // multipart/form-data with 'epubs' files
})
```

**Response**:
- Success (200): Binary EPUB file (Content-Type: application/epub+zip)
- Error (400-500): JSON with error details

### Reader View: postMessage Payload

**Reader URL**:
```
https://merge-epubs.vercel.app/#/reader
```

**Expected Payload**:
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

**Allowed Origins**:
- chrome-extension://floidkamdcekmpimibhckjfegjpgeeda
- chrome-extension://ffjopfamcpefiadpmnaoonhidikfdkif

### FormData Structure

```javascript
const formData = new FormData();
state.files.forEach(file => {
  formData.append('epubs', file);  // Multiple files with same field name
});
```

---

## 📊 File Processing Flow

### Client-Side (Browser)

```
1. User selects files
   ↓
2. Validation (type, size, count)
   ↓
3. Add to state.files
   ↓
4. Display in file list
   ↓
5. User clicks "Combine"
   ↓
6. Create FormData
   ↓
7. POST to API
   ↓
8. Track progress (30% → 60% → 90% → 100%)
   ↓
9. Receive binary blob
   ↓
10. Store in state.combinedBlob
   ↓
11. Show success
```

### Server-Side (Render API)

```
1. Receive POST with files
   ↓
2. Parse multipart form data
   ↓
3. For each file:
   - Unzip EPUB
   - Extract content.opf (metadata)
   - Extract OPS folder (content)
   ↓
4. Merge all EPUBs:
   - Combine content
   - Update metadata
   - Generate new TOC
   ↓
5. Create new EPUB:
   - Recreate structure
   - Zip files
   ↓
6. Return binary (Content-Type: application/epub+zip)
```

---

## ⚡ Performance & Limits

### Current Limits

| Setting | Value | Reason |
|---------|-------|--------|
| Max Files | 10 | API limit |
| Max Per File | 50MB | Render free tier memory (512MB RAM) |
| Total Upload | 100MB | API configured limit |
| Processing Timeout | 5 minutes | Render function timeout |

### Memory Usage Breakdown

```
Render Server (512MB total):
- Node.js base: ~80MB
- Available: ~432MB for processing

Processing Peak Usage:
- 100MB upload = 300-400MB RAM needed (3-4x file size)
- Safety margin exhausted at ~80MB upload
- Recommended max: 30-50MB realistic
```

### Performance Metrics

| Operation | Time | Notes |
|-----------|------|-------|
| UI Load | 1-2s | Vercel edge network |
| File Upload | 5-30s | Network speed dependent |
| EPUB Processing | 10-30s | File count/complexity |
| Download | <5s | Browser download |

---

## 🛠️ Development Guide

### Adding New Features

#### Example: Add file reordering

1. **HTML** (index.html):
```html
<button class="file-move-up" data-index="${index}">↑</button>
<button class="file-move-down" data-index="${index}">↓</button>
```

2. **JavaScript** (script.js):
```javascript
function moveFileUp(index) {
  if (index > 0) {
    [state.files[index], state.files[index-1]] = 
    [state.files[index-1], state.files[index]];
    updateFileList();
  }
}
```

3. **Setup listeners** in `setupEventListeners()`:
```javascript
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('file-move-up')) {
    moveFileUp(parseInt(e.target.dataset.index));
  }
});
```

### Testing Locally

1. **Start local server**:
```bash
python3 -m http.server 8080
```

2. **Open browser DevTools** (F12):
```javascript
// Test file addition
state.files.push(new File(['test'], 'test.epub', {type: 'application/epub+zip'}));
updateFileList();

// Test API connection
testConnection();
```

3. **Check console** for logs and errors

### Debugging Tips

```javascript
// Log state at any time
console.log('Current state:', state);

// Debug file sizes
state.files.forEach(f => console.log(f.name, formatFileSize(f.size)));

// Test API endpoint
fetch('https://epub-combiner-api.onrender.com/config').then(r => r.json()).then(console.log);
```

---

## 📦 Deployment Guide

### Frontend (Vercel)

**Prerequisites**:
- GitHub repository with source code
- Vercel account

**Steps**:
1. Connect GitHub repo to Vercel
2. Set Production Branch: `main`
3. No build command needed (static files)
4. Deploy

**Configuration**:
```javascript
// vercel.json (if needed in future)
{
  "buildCommand": "echo 'No build needed'",
  "outputDirectory": "."
}
```

### Backend (Render)

**Prerequisites**:
- Express.js API code
- Render account

**Steps**:
1. Create Web Service
2. Connect GitHub repo
3. Set start command: `npm start`
4. Deploy

**Environment Variables**:
```
NODE_ENV=production
PORT=3000
```

---

## 🔧 Troubleshooting

### Issue: "Failed to fetch" when combining

**Causes**:
1. API server down
2. Network error
3. CORS misconfigured
4. File size exceeds limit

**Solutions**:
```javascript
// Check in browser console
fetch('https://epub-combiner-api.onrender.com/config')
  .then(r => r.json())
  .then(console.log)
  .catch(e => console.error('API Error:', e));

// Check file sizes
console.log('Total size:', state.files.reduce((sum, f) => sum + f.size, 0));
```

---

### Issue: Vercel shows old code

**Causes**:
1. GitHub integration not refreshed
2. Browser cache stale
3. Deployment in progress

**Solutions**:
```bash
# Force redeploy
git commit --allow-empty -m "Force redeploy"
git push

# Client: Hard refresh
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R
```

---

### Issue: API response too large

**Causes**:
1. Combined EPUB too large
2. Memory exhausted on Render

**Solutions**:
1. Upgrade to Render paid plan
2. Reduce file sizes/count
3. Implement server-side streaming (code change)

---

## 📚 Important Files Reference

| File | Purpose | Key Functions |
|------|---------|---|
| `index.html` | UI structure | HTML elements, form layout |
| `styles.css` | Styling | Color scheme, responsive design |
| `script.js` | Logic | State, API calls, event handlers |
| `INTEGRATION-combine-epub.md` | API docs | Endpoint details |
| `README.md` | User guide | Setup, features, usage |
| `ARCHITECTURE.md` | This file | Technical deep dive |

---

## 🚀 Next Steps for Developers

### To Build Upon This Project:

1. **Understand the state model** - All app data in `state` object
2. **Learn the API flow** - POST `/combine-epubs` endpoint
3. **Check validation rules** - `addFiles()` function
4. **Review styling** - CSS variables for customization
5. **Test locally** - `python3 -m http.server 8080`

### Common Extensions:

- Add file reordering (drag-to-sort)
- Implement batch processing queue
- Add progress upload indicator
- Create user accounts/history
- Build mobile app wrapper
- Add metadata editor
- Integrate with cloud storage

---

**Last Updated**: 2 February 2026  
**Version**: 1.0.0  
**Status**: Production Ready

For questions or updates, refer to [README.md](README.md) or check the source code.
