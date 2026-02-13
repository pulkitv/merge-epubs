// State management
const state = {
    files: [],
    apiUrl: 'https://epub-combiner-api.onrender.com',
    apiConfig: null,
    combinedBlob: null
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
    fontSize: readerConfig.defaultFontSize,
    currentArticle: null
};

// DOM elements
const elements = {
    apiUrlInput: document.getElementById('apiUrl'),
    testConnectionBtn: document.getElementById('testConnection'),
    connectionStatus: document.getElementById('connectionStatus'),
    navLinks: document.querySelectorAll('.nav-link'),
    mergeView: document.getElementById('mergeView'),
    readerView: document.getElementById('readerView'),
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('epubFiles'),
    fileList: document.getElementById('fileList'),
    combineBtn: document.getElementById('combineBtn'),
    progressSection: document.getElementById('progressSection'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    resultSection: document.getElementById('resultSection'),
    downloadBtn: document.getElementById('downloadBtn'),
    resetBtn: document.getElementById('resetBtn'),
    errorSection: document.getElementById('errorSection'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    readerTitle: document.getElementById('readerTitle'),
    readerByline: document.getElementById('readerByline'),
    readerSource: document.getElementById('readerSource'),
    readerStatus: document.getElementById('readerStatus'),
    articleRoot: document.getElementById('articleRoot'),
    themeToggle: document.getElementById('themeToggle'),
    fontButtons: document.querySelectorAll('.font-btn'),
    downloadEpubBtn: document.getElementById('downloadEpub')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    state.apiUrl = 'https://epub-combiner-api.onrender.com';
    elements.apiUrlInput.value = state.apiUrl;
    setReaderTheme(readerState.theme);
    setReaderFontSize(readerState.fontSize);
    setupEventListeners();
    setupRouting();
    setupReaderMessaging();
    testConnection(); // Auto-test connection on load
});

// Setup event listeners
function setupEventListeners() {
    // API configuration
    elements.apiUrlInput.addEventListener('change', (e) => {
        state.apiUrl = e.target.value.trim();
    });
    elements.testConnectionBtn.addEventListener('click', testConnection);

    // File upload
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);

    // Combine button
    elements.combineBtn.addEventListener('click', combineEpubs);

    // Result actions
    elements.downloadBtn.addEventListener('click', downloadCombinedEpub);
    elements.resetBtn.addEventListener('click', resetUI);
    elements.retryBtn.addEventListener('click', resetUI);

    // Reader tools
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleReaderTheme);
    }
    elements.fontButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const size = Number(button.dataset.font);
            if (!Number.isNaN(size)) {
                setReaderFontSize(size);
            }
        });
    });

    // Download EPUB
    if (elements.downloadEpubBtn) {
        elements.downloadEpubBtn.addEventListener('click', downloadAsEpub);
    }
}

function setupRouting() {
    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange();
}

function handleRouteChange() {
    const view = getViewFromHash();
    setActiveView(view);
}

function getViewFromHash() {
    const hash = window.location.hash || '#/merge';
    if (hash.includes('reader')) {
        return 'reader';
    }
    return 'merge';
}

function setActiveView(view) {
    if (!elements.mergeView || !elements.readerView) return;

    const isReader = view === 'reader';
    elements.mergeView.style.display = isReader ? 'none' : 'block';
    elements.readerView.style.display = isReader ? 'block' : 'none';

    elements.navLinks.forEach((link) => {
        link.classList.toggle('active', link.dataset.view === view);
    });

    if (isReader) {
        setReaderStatus('Waiting for content from extension...', 'success');
        notifyExtensionReady();
    }
}

function toggleReaderTheme() {
    const nextTheme = readerState.theme === 'dark' ? 'light' : 'dark';
    setReaderTheme(nextTheme);
}

function setReaderTheme(theme) {
    readerState.theme = theme;
    document.body.setAttribute('data-theme', theme);
    if (elements.themeToggle) {
        elements.themeToggle.textContent = theme === 'dark' ? 'Dark' : 'Light';
    }
}

function setReaderFontSize(size) {
    readerState.fontSize = size;
    document.documentElement.style.setProperty('--reader-font-size', `${size}px`);
    elements.fontButtons.forEach((button) => {
        button.classList.toggle('active', Number(button.dataset.font) === size);
    });
}

function setupReaderMessaging() {
    window.addEventListener('message', handleReaderMessage);
    console.log('Reader messaging setup complete. Listening for messages from:', readerConfig.allowedOrigins);
}

function handleReaderMessage(event) {
    console.log('Message received:', {
        origin: event.origin,
        data: event.data,
        allowed: readerConfig.allowedOrigins.includes(event.origin)
    });

    if (!readerConfig.allowedOrigins.includes(event.origin)) {
        console.log('Message from unauthorized origin:', event.origin);
        return;
    }

    const payload = event.data;
    if (!payload || payload.type !== 'readeasy-article') {
        console.log('Invalid payload type:', payload?.type);
        return;
    }

    console.log('Valid article received:', payload.title);
    
    // Switch to reader view if not already there
    if (window.location.hash !== '#/reader') {
        console.log('Navigating to reader view');
        window.location.hash = '#/reader';
    }
    
    renderReaderContent(payload);
}

function renderReaderContent(payload) {
    const title = payload.title || 'Untitled Article';
    const byline = payload.byline || payload.siteName || '';
    const sourceUrl = payload.sourceUrl || '#';

    if (elements.readerTitle) elements.readerTitle.textContent = title;
    if (elements.readerByline) elements.readerByline.textContent = byline;
    if (elements.readerSource) {
        elements.readerSource.href = sourceUrl;
        elements.readerSource.textContent = payload.siteName ? `Source: ${payload.siteName}` : 'Open source';
    }

    const sanitizedHtml = sanitizeArticleHtml(payload.html || '', sourceUrl);
    if (elements.articleRoot) {
        elements.articleRoot.innerHTML = sanitizedHtml;
    }

    // Store payload for EPUB download
    readerState.currentArticle = payload;
    
    // Enable download button
    if (elements.downloadEpubBtn) {
        elements.downloadEpubBtn.disabled = false;
    }

    setReaderStatus('Content loaded successfully.', 'success');
}

function sanitizeArticleHtml(html, sourceUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const blockedTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'meta'];
    blockedTags.forEach((tag) => {
        doc.querySelectorAll(tag).forEach((node) => node.remove());
    });

    doc.querySelectorAll('*').forEach((node) => {
        [...node.attributes].forEach((attr) => {
            const name = attr.name.toLowerCase();
            const value = attr.value || '';
            if (name.startsWith('on') || name === 'style') {
                node.removeAttribute(attr.name);
            }
            if ((name === 'href' || name === 'src') && value.trim().toLowerCase().startsWith('javascript:')) {
                node.removeAttribute(attr.name);
            }
            if ((name === 'href' || name === 'src') && sourceUrl) {
                try {
                    const isAbsolute = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value) || value.startsWith('//');
                    if (!isAbsolute && value.trim() !== '') {
                        const resolved = new URL(value, sourceUrl);
                        node.setAttribute(attr.name, resolved.toString());
                    }
                } catch (error) {
                    // Ignore invalid URLs
                }
            }
        });

        if (sourceUrl && node.hasAttribute('srcset')) {
            const rawSrcset = node.getAttribute('srcset') || '';
            const resolvedSrcset = rawSrcset
                .split(',')
                .map((entry) => entry.trim())
                .filter(Boolean)
                .map((entry) => {
                    const [urlPart, descriptor] = entry.split(/\s+/, 2);
                    if (!urlPart) return '';
                    try {
                        const isAbsolute = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(urlPart) || urlPart.startsWith('//');
                        const resolvedUrl = isAbsolute ? urlPart : new URL(urlPart, sourceUrl).toString();
                        return descriptor ? `${resolvedUrl} ${descriptor}` : resolvedUrl;
                    } catch (error) {
                        return entry;
                    }
                })
                .filter(Boolean)
                .join(', ');

            if (resolvedSrcset) {
                node.setAttribute('srcset', resolvedSrcset);
            } else {
                node.removeAttribute('srcset');
            }
        }
    });

    return doc.body.innerHTML;
}

function setReaderStatus(message, type = 'success') {
    if (!elements.readerStatus) return;
    elements.readerStatus.className = `status-message ${type}`;
    elements.readerStatus.textContent = message;
    elements.readerStatus.style.display = 'block';
}

async function downloadAsEpub() {
    if (!readerState.currentArticle) {
        alert('No article loaded to download');
        return;
    }

    const payload = readerState.currentArticle;
    const title = payload.title || 'Untitled Article';
    const author = payload.byline || 'Unknown Author';
    const sourceUrl = payload.sourceUrl || '';
    const html = payload.html || '';

    try {
        const zip = new JSZip();

        // 1. Add mimetype (must be first, uncompressed)
        zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

        // 2. Add META-INF/container.xml
        const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
        zip.file('META-INF/container.xml', containerXml);

        // 3. Add OEBPS/toc.ncx
        const xmlEscapedTitle = escapeXml(title);
        const xmlEscapedAuthor = escapeXml(author);
        const uuid = generateUuid();
        const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${xmlEscapedTitle}</text>
  </docTitle>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel>
        <text>${xmlEscapedTitle}</text>
      </navLabel>
      <content src="content.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;
        zip.file('OEBPS/toc.ncx', tocNcx);

        // 4. Add OEBPS/content.opf
        const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="uid">urn:uuid:${uuid}</dc:identifier>
    <dc:title>${xmlEscapedTitle}</dc:title>
    <dc:creator opf:role="aut">${xmlEscapedAuthor}</dc:creator>
    <dc:language>en</dc:language>
    <meta name="generator" content="ReadEasy"/>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`;
        zip.file('OEBPS/content.opf', contentOpf);

        // 5. Convert HTML to valid XHTML
        const xhtmlContent = convertToXhtml(html);

        // 6. Add OEBPS/content.xhtml
        const contentXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <title>${xmlEscapedTitle}</title>
</head>
<body>
  <h1>${xmlEscapedTitle}</h1>
  ${author !== 'Unknown Author' ? `<p><em>By ${xmlEscapedAuthor}</em></p>` : ''}
  ${sourceUrl ? `<p><a href="${escapeXml(sourceUrl)}">Original source</a></p>` : ''}
  <hr />
  ${xhtmlContent}
</body>
</html>`;
        zip.file('OEBPS/content.xhtml', contentXhtml);

        // Generate and download
        const blob = await zip.generateAsync({ 
            type: 'blob',
            mimeType: 'application/epub+zip',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeFilename = title.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_').substring(0, 50);
        a.download = `${safeFilename || 'article'}.epub`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('EPUB generation failed:', error);
        alert('Failed to generate EPUB file. Please try again.');
    }
}

function escapeXml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function convertToXhtml(html) {
    if (!html) return '';
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove problematic elements
    const removeElements = doc.querySelectorAll('script, style, iframe, object, embed');
    removeElements.forEach(el => el.remove());
    
    // Fix self-closing tags
    const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link'];
    selfClosing.forEach(tag => {
        doc.querySelectorAll(tag).forEach(el => {
            // Ensure required attributes exist
            if (tag === 'img' && !el.hasAttribute('alt')) {
                el.setAttribute('alt', '');
            }
        });
    });
    
    // Serialize to string
    const serializer = new XMLSerializer();
    let xhtml = '';
    
    try {
        Array.from(doc.body.childNodes).forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const serialized = serializer.serializeToString(node);
                xhtml += serialized;
            } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                xhtml += escapeXml(node.textContent);
            }
        });
    } catch (e) {
        // Fallback to innerHTML if serialization fails
        xhtml = doc.body.innerHTML;
    }
    
    // XHTML compliance fixes
    xhtml = xhtml
        .replace(/<br>/gi, '<br />')
        .replace(/<hr>/gi, '<hr />')
        .replace(/<img([^>]*?)>/gi, '<img$1 />')
        .replace(/<input([^>]*?)>/gi, '<input$1 />')
        .replace(/<meta([^>]*?)>/gi, '<meta$1 />')
        .replace(/<link([^>]*?)>/gi, '<link$1 />')
        .replace(/&nbsp;/g, '&#160;')
        .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
        // Remove empty attributes
        .replace(/\s+\w+=""/g, '');
    
    return xhtml;
}

function notifyExtensionReady() {
    if (!window.opener) return;
    readerConfig.allowedOrigins.forEach((origin) => {
        try {
            window.opener.postMessage('readeasy-ready', origin);
        } catch (error) {
            console.warn('Unable to notify extension origin:', origin, error);
        }
    });
}

// Test API connection
async function testConnection() {
    elements.testConnectionBtn.disabled = true;
    elements.testConnectionBtn.textContent = 'Testing...';
    elements.connectionStatus.className = 'status-message';
    elements.connectionStatus.style.display = 'none';

    try {
        console.log(`Testing connection to: ${state.apiUrl}/config`);
        const response = await fetch(`${state.apiUrl}/config`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        state.apiConfig = await response.json();
        console.log('API Config:', state.apiConfig);
        
        elements.connectionStatus.className = 'status-message success';
        elements.connectionStatus.textContent = `✓ Connected! Max files: ${state.apiConfig.maxFiles}, Max size: ${state.apiConfig.maxFileSizeMB}MB per file, Total upload: 100MB limit`;
        elements.connectionStatus.style.display = 'block';
        
    } catch (error) {
        console.error('Connection test error:', error);
        elements.connectionStatus.className = 'status-message error';
        elements.connectionStatus.textContent = `✗ Connection failed: ${error.message}. Check API URL.`;
        elements.connectionStatus.style.display = 'block';
        state.apiConfig = null;
    } finally {
        elements.testConnectionBtn.disabled = false;
        elements.testConnectionBtn.textContent = 'Test Connection';
    }
}

// Handle file selection
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
        file.name.toLowerCase().endsWith('.epub')
    );
    
    if (files.length === 0) {
        showError('Please drop only EPUB files');
        return;
    }
    
    addFiles(files);
}

// Add files to state
function addFiles(newFiles) {
    const maxFiles = state.apiConfig?.maxFiles || 10;
    const maxFileSize = state.apiConfig?.maxFileSize || 52428800; // 50MB default

    // Filter EPUB files
    const epubFiles = newFiles.filter(file => 
        file.name.toLowerCase().endsWith('.epub')
    );

    if (epubFiles.length === 0) {
        showError('Please select only EPUB files');
        return;
    }

    // Check total count
    if (state.files.length + epubFiles.length > maxFiles) {
        showError(`Maximum ${maxFiles} files allowed. You can add ${maxFiles - state.files.length} more.`);
        return;
    }

    // Check file sizes
    for (const file of epubFiles) {
        if (file.size > maxFileSize) {
            showError(`File "${file.name}" is too large. Maximum size is ${formatFileSize(maxFileSize)}`);
            return;
        }
    }

    // Add files to state
    state.files.push(...epubFiles);
    updateFileList();
    updateCombineButton();
    
    // Reset file input
    elements.fileInput.value = '';
}

// Update file list display
function updateFileList() {
    if (state.files.length === 0) {
        elements.fileList.innerHTML = '';
        return;
    }

    elements.fileList.innerHTML = state.files.map((file, index) => `
        <div class="file-item">
            <div class="file-info">
                <svg class="file-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <div class="file-details">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="file-remove" onclick="removeFile(${index})" title="Remove file">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `).join('');
}

// Remove file from state
function removeFile(index) {
    state.files.splice(index, 1);
    updateFileList();
    updateCombineButton();
}

// Update combine button state
function updateCombineButton() {
    elements.combineBtn.disabled = state.files.length < 2;
    
    if (state.files.length === 0) {
        elements.combineBtn.textContent = 'Combine EPUBs';
    } else if (state.files.length === 1) {
        elements.combineBtn.textContent = 'Add at least 1 more EPUB';
    } else {
        elements.combineBtn.textContent = `Combine ${state.files.length} EPUBs`;
    }
}

// Combine EPUBs
async function combineEpubs() {
    // Validate files
    if (state.files.length < 2) {
        showError('Please select at least 2 EPUB files');
        return;
    }

    // Hide other sections
    elements.errorSection.style.display = 'none';
    elements.resultSection.style.display = 'none';
    
    // Show progress
    elements.progressSection.style.display = 'block';
    elements.progressFill.style.width = '30%';
    elements.progressText.textContent = 'Uploading files...';

    // Disable combine button
    elements.combineBtn.disabled = true;

    try {
        // Create form data
        const formData = new FormData();
        state.files.forEach(file => {
            formData.append('epubs', file);
        });

        // Update progress
        elements.progressFill.style.width = '60%';
        elements.progressText.textContent = 'Combining EPUBs...';

        console.log(`Sending request to: ${state.apiUrl}/combine-epubs`);
        console.log(`Total files: ${state.files.length}`);

        // Make API request
        const response = await fetch(`${state.apiUrl}/combine-epubs`, {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers));

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
                errorMessage = await response.text() || errorMessage;
            }
            throw new Error(errorMessage);
        }

        // Update progress
        elements.progressFill.style.width = '90%';
        elements.progressText.textContent = 'Processing...';

        // Get the blob
        state.combinedBlob = await response.blob();
        console.log('Combined EPUB size:', state.combinedBlob.size, 'bytes');

        // Complete
        elements.progressFill.style.width = '100%';
        elements.progressText.textContent = 'Complete!';

        // Show result
        setTimeout(() => {
            elements.progressSection.style.display = 'none';
            elements.resultSection.style.display = 'block';
        }, 500);

    } catch (error) {
        console.error('Error combining EPUBs:', error);
        elements.progressSection.style.display = 'none';
        showError(`Failed to combine EPUBs: ${error.message}`);
        elements.combineBtn.disabled = false;
    }
}

// Download combined EPUB
function downloadCombinedEpub() {
    if (!state.combinedBlob) {
        showError('No combined EPUB available');
        return;
    }

    const url = window.URL.createObjectURL(state.combinedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'combined.epub';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Reset UI
function resetUI() {
    state.files = [];
    state.combinedBlob = null;
    elements.fileInput.value = '';
    updateFileList();
    updateCombineButton();
    elements.progressSection.style.display = 'none';
    elements.resultSection.style.display = 'none';
    elements.errorSection.style.display = 'none';
    elements.combineBtn.disabled = true;
}

// Show error
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorSection.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (elements.errorSection.style.display !== 'none') {
            elements.errorSection.style.display = 'none';
        }
    }, 5000);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
