# Quick Start Guide for AI Coding Assistants

**Use this guide when working with the EPUB Combiner project.**

## 🎯 Project At A Glance

- **What**: Web UI to combine multiple EPUB files into one
- **Also**: Reader view that renders HTML via Chrome extension postMessage
- **Where**: https://merge-epubs.vercel.app
- **Tech**: HTML/CSS/JS frontend (Vercel) + Express API (Render)
- **Status**: ✅ Production Ready

## 📊 30-Second Overview

```
User uploads 2-10 EPUB files (50MB max each)
        ↓
UI validates and sends to API
        ↓
API combines EPUBs (merges content, generates TOC)
        ↓
User downloads combined EPUB file

Reader View:
Extension sends HTML via postMessage → UI sanitizes and renders
```

## 🔑 Key Files to Know

| File | What's Inside |
|------|---|
| **script.js** | ALL application logic here |
| **index.html** | HTML structure (IDs used by JS) |
| **styles.css** | Design (CSS variables for colors) |
| **doc/architecture.md** | Deep technical details |
| **WEBAPP_POSTMESSAGE_README.md** | Extension integration details |

## 💾 Critical Variables

```javascript
state.files              // Array of File objects to combine
state.apiUrl            // Current API endpoint
state.apiConfig         // {maxFiles: 10, maxFileSize: 50MB...}
state.combinedBlob      // Downloaded EPUB binary data
readerConfig            // Allowed extension origins + defaults
readerState             // Current theme + font size
```

## 🚀 Main Functions (Read These First)

### Entry Point
```javascript
document.addEventListener('DOMContentLoaded', () => {
  // App initialization happens here
  testConnection();  // Verify API is reachable
});
```

### Core Operation
```javascript
async function combineEpubs() {
  // 1. Validate files (at least 2)
  // 2. Create FormData
  // 3. POST to API
  // 4. Handle response
  // 5. Download or show error
}
```

### Supporting Functions
- `addFiles()` - Validate and store uploaded files
- `updateFileList()` - Refresh file display
- `testConnection()` - Verify API connectivity
- `downloadCombinedEpub()` - Trigger download
- `showError()` - Display error messages
- `setupReaderMessaging()` - postMessage listener
- `renderReaderContent()` - Sanitize + render HTML
- `toggleReaderTheme()` - Theme toggle
- `setReaderFontSize()` - Font size presets

## 🔗 API Integration

**Test Connection**:
```javascript
GET https://epub-combiner-api.onrender.com/config
// Returns: {maxFiles: 10, maxFileSize: 52428800, ...}
```

**Combine Files**:
```javascript
POST https://epub-combiner-api.onrender.com/combine-epubs
Body: FormData with 'epubs' field (multiple files)
Response: Binary EPUB (Content-Type: application/epub+zip)
```

**Reader View (postMessage)**:
```
Reader URL: https://merge-epubs.vercel.app/#/reader
Allowed origins: chrome-extension://floidkamdcekmpimibhckjfegjpgeeda
                 chrome-extension://ffjopfamcpefiadpmnaoonhidikfdkif
Payload: { type: 'readeasy-article', title, byline, siteName, sourceUrl, html }
```

## ✅ Validation Rules

```javascript
// What the app checks before sending to API
✓ File extension: .epub only
✓ Per-file size: max 50MB
✓ File count: 2-10 files
✓ Total size: max 100MB
```

## 🎨 UI State Machine

```
IDLE (waiting for files)
  ↓
UPLOADING (files selected)
  ↓
COMBINING (showing progress bar)
  ↓
SUCCESS (show download button)
    OR
ERROR (show error message)
```

## 📱 Mobile Responsive

- Breakpoint: 640px
- Mobile: Stack elements vertically
- Desktop: Side-by-side layout

## 🐛 Common Issues & Fixes

| Issue | Location in Code | Fix |
|-------|---|---|
| Files not uploading | `addFiles()` | Check size/type validation |
| API connection fails | `testConnection()` | Verify API URL |
| Progress not showing | CSS `.progress-bar` | Check animation |
| Download doesn't work | `downloadCombinedEpub()` | Check blob creation |

## 📈 To Extend This Project

**Add Feature Template**:
```javascript
// 1. Add HTML element in index.html
<input id="myNewFeature">

// 2. Cache in elements object in script.js
const elements = {
  ...existing,
  myNewFeature: document.getElementById('myNewFeature')
};

// 3. Add function
function myFeatureHandler() {
  // Do something with state
  // Update UI
}

// 4. Setup listener in setupEventListeners()
elements.myNewFeature.addEventListener('change', myFeatureHandler);
```

## 🚀 Deployment Quick Check

**Frontend**: Visit https://merge-epubs.vercel.app
- If shows old code → Check GitHub branch (should be `main`)
- If shows errors → Check browser console (F12)

**Backend**: Test API
```bash
curl https://epub-combiner-api.onrender.com/config
# Should return JSON with config
```

## 📚 Documentation Map

1. **Start Here**: This file (30-second overview)
2. **Then Read**: [README.md](README.md) (features & usage)
3. **Deep Dive**: [doc/architecture.md](doc/architecture.md) (technical details)
4. **API Info**: [INTEGRATION-combine-epub.md](INTEGRATION-combine-epub.md) (backend API)

## 💡 Pro Tips

**Debugging**:
```javascript
// Open console (F12) and paste:
console.log('Files:', state.files);
console.log('API URL:', state.apiUrl);
console.log('Config:', state.apiConfig);
```

**Testing Locally**:
```bash
python3 -m http.server 8080
# Then visit http://localhost:8080
```

**Hard Refresh Cache**:
- Mac: Cmd + Shift + R
- Windows: Ctrl + Shift + R

## 🎯 Next Steps When Extending

1. Understand `state` object (all app data)
2. Look at `combineEpubs()` function (main operation)
3. Review `setupEventListeners()` (event handlers)
4. Check validation in `addFiles()` (constraints)
5. Study CSS variables for styling changes

## 📞 Need More Details?

- **How does combining work?** → See [doc/architecture.md - File Processing Flow](doc/architecture.md#file-processing-flow)
- **What are the limits?** → See [doc/architecture.md - Performance & Limits](doc/architecture.md#performance--limits)
- **How to deploy changes?** → See [doc/architecture.md - Deployment Guide](doc/architecture.md#deployment-guide)
- **Troubleshooting?** → See [doc/architecture.md - Troubleshooting](doc/architecture.md#troubleshooting)

---

**Version**: 1.0.0 | **Status**: Production | **Updated**: 2 February 2026

💡 **Tip**: Bookmark this file for quick reference when jumping into the project!
