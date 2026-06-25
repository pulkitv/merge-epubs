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
    defaultTheme: 'light',
    defaultFontSize: 18
};

const authConfig = {
    clientId: '1013859959230-hfo0mohq8c02hkea0v56rshdv660b2qp.apps.googleusercontent.com'
};


const readerState = {
    theme: readerConfig.defaultTheme,
    fontSize: readerConfig.defaultFontSize,
    currentArticle: null,
    convertText: '',
    convertTitle: ''
};

const authState = {
    isLoggedIn: false,
    profile: null,
    idToken: null
};

const editorState = {
    active: false,
    savedRange: null,           // cloned Range restored before execCommand
    snapshot: null,             // { html, title, byline } for Cancel rollback
    currentHlColor: '#fef08a',
    currentFontColor: '#ef4444',
    pendingImageDataUri: null,  // data URI from FileReader upload
    editingLink: null           // <a> element being edited (pre-populated link modal)
};

const paginationState = {
    enabled: false,
    pages: [],      // HTML string per chapter
    currentPage: 0
};

const libraryState = {
    articles: [],
    loaded: false,
    loading: false,
    error: null
};

// DOM elements
const elements = {
    apiUrlInput: document.getElementById('apiUrl'),
    testConnectionBtn: document.getElementById('testConnection'),
    connectionStatus: document.getElementById('connectionStatus'),
    navLinks: document.querySelectorAll('.nav-link'),
    mergeView: document.getElementById('mergeView'),
    readerView: document.getElementById('readerView'),
    convertView: document.getElementById('convertView'),
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
    downloadEpubBtn: document.getElementById('downloadEpub'),
    epubUploadBtn: document.getElementById('epubUploadBtn'),
    epubUploadInput: document.getElementById('epubUploadInput'),
    convertInput: document.getElementById('convertInput'),
    convertSubmit: document.getElementById('convertSubmit'),
    convertTitle: document.getElementById('convertTitle'),
    convertLink: document.querySelector('.nav-link[data-view="convert"]'),
    googleSignIn: document.getElementById('googleSignIn'),
    logoutBtn: document.getElementById('logoutBtn'),
    authProfile: document.getElementById('authProfile'),
    authAvatar: document.getElementById('authAvatar'),
    authName: document.getElementById('authName'),
    // Edit mode
    editToggleBtn: document.getElementById('editToggleBtn'),
    editToolbarRow: document.getElementById('editToolbarRow'),
    editActionRow: document.getElementById('editActionRow'),
    editSaveBtn: document.getElementById('editSaveBtn'),
    editCancelBtn: document.getElementById('editCancelBtn'),
    editCmdButtons: document.querySelectorAll('#editToolbarRow .edit-btn[data-cmd]'),
    editBtnFontColor: document.getElementById('editBtnFontColor'),
    editColorPicker: document.getElementById('editColorPicker'),
    editColorBar: document.getElementById('editColorBar'),
    editHlPresets: document.querySelectorAll('.edit-hl-preset'),
    editHlRemove: document.getElementById('editHlRemove'),
    editHlCustom: document.getElementById('editHlCustom'),
    editHlCustomBar: document.getElementById('editHlCustomBar'),
    editFontSizeSelect: document.getElementById('editFontSizeSelect'),
    editBtnHr: document.getElementById('editBtnHr'),
    editBtnNote: document.getElementById('editBtnNote'),
    editBtnImage: document.getElementById('editBtnImage'),
    editBtnLink: document.getElementById('editBtnLink'),
    // Image modal
    editImageModal: document.getElementById('editImageModal'),
    editImgTabUrl: document.getElementById('editImgTabUrl'),
    editImgTabFile: document.getElementById('editImgTabFile'),
    editImgPanelUrl: document.getElementById('editImgPanelUrl'),
    editImgPanelFile: document.getElementById('editImgPanelFile'),
    editImgUrlInput: document.getElementById('editImgUrlInput'),
    editImgAltUrl: document.getElementById('editImgAltUrl'),
    editImgFileInput: document.getElementById('editImgFileInput'),
    editImgAltFile: document.getElementById('editImgAltFile'),
    editImgPreview: document.getElementById('editImgPreview'),
    editImgInsertBtn: document.getElementById('editImgInsertBtn'),
    editImgCancelBtn: document.getElementById('editImgCancelBtn'),
    // Link modal
    editLinkModal: document.getElementById('editLinkModal'),
    editLinkText: document.getElementById('editLinkText'),
    editLinkUrl: document.getElementById('editLinkUrl'),
    editLinkInsertBtn: document.getElementById('editLinkInsertBtn'),
    editLinkCancelBtn: document.getElementById('editLinkCancelBtn'),
    // Pagination
    paginationTop: document.getElementById('paginationTop'),
    paginationBottom: document.getElementById('paginationBottom'),
    // Library sidebar
    libraryToggleBtn: document.getElementById('libraryToggleBtn'),
    articleSidebar: document.getElementById('articleSidebar'),
    sidebarList: document.getElementById('sidebarList'),
    sidebarRefreshBtn: document.getElementById('sidebarRefreshBtn'),
    sidebarCloseBtn: document.getElementById('sidebarCloseBtn'),
    sidebarNewBtn: document.getElementById('sidebarNewBtn'),

    // Version history
    versionHistoryBtn: document.getElementById('versionHistoryBtn'),
    versionHistoryModal: document.getElementById('versionHistoryModal'),
    versionModalClose: document.getElementById('versionModalClose'),
    versionList: document.getElementById('versionList'),

    // Screen-blocking busy overlay
    busyOverlay: document.getElementById('busyOverlay'),
    busyOverlayLabel: document.getElementById('busyOverlayLabel')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    state.apiUrl = 'https://epub-combiner-api.onrender.com';
    elements.apiUrlInput.value = state.apiUrl;
    setReaderTheme(readerState.theme);
    setReaderFontSize(readerState.fontSize);
    loadAuthState();
    setupEventListeners();
    setupRouting();
    setupReaderMessaging();
    setupGoogleAuth();
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

    // EPUB upload (open in reader)
    if (elements.epubUploadBtn) {
        elements.epubUploadBtn.addEventListener('click', () => elements.epubUploadInput.click());
    }
    if (elements.epubUploadInput) {
        elements.epubUploadInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) parseAndLoadEpub(file);
            elements.epubUploadInput.value = '';
        });
    }

    // Download EPUB
    if (elements.downloadEpubBtn) {
        elements.downloadEpubBtn.addEventListener('click', downloadAsEpub);
    }

    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }

    if (elements.convertLink) {
        elements.convertLink.addEventListener('click', (event) => {
            if (!authState.isLoggedIn) {
                event.preventDefault();
            }
        });
    }

    if (elements.convertInput) {
        elements.convertInput.addEventListener('input', () => {
            readerState.convertText = elements.convertInput.value;
            updateConvertSubmitState();
        });
    }

    if (elements.convertTitle) {
        elements.convertTitle.addEventListener('input', () => {
            readerState.convertTitle = elements.convertTitle.value;
        });
    }

    if (elements.convertSubmit) {
        elements.convertSubmit.addEventListener('click', handleConvertSubmit);
    }

    setupEditEventListeners();
    setupPaginationListeners();
    setupLibraryEventListeners();
    setupVersionHistoryListeners();
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
    if (hash.includes('convert')) {
        return 'convert';
    }
    if (hash.includes('reader')) {
        return 'reader';
    }
    return 'merge';
}

function setActiveView(view) {
    if (!elements.mergeView || !elements.readerView || !elements.convertView) return;

    if (view === 'convert' && !authState.isLoggedIn) {
        window.location.hash = '#/reader';
        return;
    }

    const isReader = view === 'reader';
    const isConvert = view === 'convert';
    elements.mergeView.style.display = isReader || isConvert ? 'none' : 'block';
    elements.readerView.style.display = isReader ? 'block' : 'none';
    elements.convertView.style.display = isConvert ? 'block' : 'none';
    document.body.dataset.view = view;

    elements.navLinks.forEach((link) => {
        link.classList.toggle('active', link.dataset.view === view);
    });

    if (isReader) {
        setReaderStatus('Waiting for content from extension...', 'success');
        notifyExtensionReady();
    }

    if (isConvert && elements.convertInput) {
        elements.convertInput.value = readerState.convertText || '';
        updateConvertSubmitState();
    }

    if (isConvert && elements.convertTitle) {
        elements.convertTitle.value = readerState.convertTitle || '';
    }
}

function loadAuthState() {
    try {
        const stored = localStorage.getItem('readeasy-auth');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Google ID tokens expire after ~1 hour. A stored-but-expired token
            // would leave the UI "logged in" while every API call 401s. Drop it
            // on load so the UI starts in an honest state.
            if (parsed?.idToken && !isTokenExpired(parsed.idToken)) {
                authState.isLoggedIn = true;
                authState.profile = parsed?.profile || null;
                authState.idToken = parsed.idToken;
            } else {
                localStorage.removeItem('readeasy-auth');
            }
        }
    } catch (error) {
        console.warn('Unable to load auth state', error);
    }

    updateAuthUI();
}

// Returns true if the JWT's `exp` claim is in the past (or unreadable). A 30s
// skew guard avoids treating an about-to-expire token as still valid.
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (!payload.exp) return false; // no exp claim — let the server decide
        return Date.now() >= (payload.exp * 1000) - 30000;
    } catch (error) {
        return true; // unparseable token is effectively useless
    }
}

// Called when a server response says the session is dead. Reconciles the UI
// (which may still show a profile) with reality and tells the user once.
function handleExpiredSession() {
    if (!authState.isLoggedIn) return;
    clearAuthState();
    updateAuthUI();
    setReaderStatus('Your session expired. Please sign in again.', 'error');
    if (window.location.hash === '#/convert') {
        window.location.hash = '#/reader';
    }
}

function saveAuthState() {
    try {
        const payload = {
            idToken: authState.idToken,
            profile: authState.profile
        };
        localStorage.setItem('readeasy-auth', JSON.stringify(payload));
    } catch (error) {
        console.warn('Unable to save auth state', error);
    }
}

function clearAuthState() {
    authState.isLoggedIn = false;
    authState.profile = null;
    authState.idToken = null;
    localStorage.removeItem('readeasy-auth');
    libraryState.articles = [];
    libraryState.loaded = false;
    libraryState.loading = false;
    libraryState.error = null;
}

function setupGoogleAuth() {
    if (!authConfig.clientId || authConfig.clientId === 'YOUR_GOOGLE_CLIENT_ID') {
        console.warn('Google auth not initialized. Provide a valid client ID.');
        return;
    }

    initGoogleAuthWithRetry(0);
}

function initGoogleAuthWithRetry(attempt) {
    if (!window.google?.accounts?.id) {
        if (attempt < 10) {
            setTimeout(() => initGoogleAuthWithRetry(attempt + 1), 300);
        } else {
            console.warn('Google Identity Services did not load.');
        }
        return;
    }

    window.google.accounts.id.initialize({
        client_id: authConfig.clientId,
        callback: handleGoogleCredential
    });

    if (elements.googleSignIn) {
        elements.googleSignIn.innerHTML = '';
        window.google.accounts.id.renderButton(elements.googleSignIn, {
            theme: 'outline',
            size: 'medium',
            shape: 'pill'
        });
    }
}

function handleGoogleCredential(response) {
    if (!response?.credential) return;

    const profile = decodeJwtProfile(response.credential);
    authState.isLoggedIn = true;
    authState.idToken = response.credential;
    authState.profile = profile;
    saveAuthState();
    updateAuthUI();
}

function handleLogout() {
    clearAuthState();
    updateAuthUI();
    if (window.location.hash === '#/convert') {
        window.location.hash = '#/reader';
    }
}

function decodeJwtProfile(token) {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        return {
            name: decoded.name || decoded.given_name || 'User',
            email: decoded.email || '',
            picture: decoded.picture || ''
        };
    } catch (error) {
        console.warn('Unable to decode id token', error);
        return { name: 'User', email: '', picture: '' };
    }
}


function updateAuthUI() {
    if (elements.convertLink) {
        elements.convertLink.style.display = 'inline-flex';
        elements.convertLink.classList.toggle('locked', !authState.isLoggedIn);
        elements.convertLink.setAttribute('aria-disabled', authState.isLoggedIn ? 'false' : 'true');
        elements.convertLink.setAttribute('title', authState.isLoggedIn ? '' : 'Log In Required');
    }

    if (elements.authProfile) {
        elements.authProfile.style.display = authState.isLoggedIn ? 'flex' : 'none';
    }

    if (elements.authName) {
        elements.authName.textContent = authState.profile?.name || 'User';
    }

    if (elements.authAvatar) {
        if (authState.profile?.picture) {
            elements.authAvatar.src = authState.profile.picture;
            elements.authAvatar.style.display = 'block';
        } else {
            elements.authAvatar.removeAttribute('src');
            elements.authAvatar.style.display = 'none';
        }
    }

    if (elements.logoutBtn) {
        elements.logoutBtn.style.display = authState.isLoggedIn ? 'inline-flex' : 'none';
    }

    if (elements.googleSignIn) {
        elements.googleSignIn.style.display = authState.isLoggedIn ? 'none' : 'block';
    }

    // Library sidebar is always shown — content adapts to auth state. The toggle
    // button stays visible so users can collapse / expand the sidebar regardless.
    if (authState.isLoggedIn) {
        // Re-render with fresh state (loads articles if not already loaded)
        loadLibrary();
    } else {
        // Reset library state and render the "sign in" prompt
        libraryState.articles = [];
        libraryState.loaded = false;
        libraryState.loading = false;
        libraryState.error = null;
        renderSidebarSignInPrompt();
    }

    // "+ New" only makes sense when signed in (creates a row scoped to google_uid)
    if (elements.sidebarNewBtn) {
        elements.sidebarNewBtn.style.display = authState.isLoggedIn ? '' : 'none';
    }
}

function updateConvertSubmitState() {
    if (!elements.convertSubmit || !elements.convertInput) return;
    const hasText = elements.convertInput.value.trim().length > 0;
    elements.convertSubmit.disabled = !hasText;
}

function handleConvertSubmit() {
    if (!elements.convertInput) return;
    const rawText = elements.convertInput.value.trim();
    if (!rawText) return;

    readerState.convertText = rawText;
    if (elements.convertTitle) {
        readerState.convertTitle = elements.convertTitle.value.trim();
    }
    const html = convertPlainTextToHtml(rawText);

    const title = readerState.convertTitle || 'Converted Text';

    const payload = {
        type: 'readeasy-article',
        title,
        byline: '',
        siteName: '',
        sourceUrl: '',
        html
    };

    if (window.location.hash !== '#/reader') {
        window.location.hash = '#/reader';
    }

    renderReaderContent(payload);
}

function toggleReaderTheme() {
    const cycle = { light: 'dark', dark: 'warm', warm: 'light' };
    setReaderTheme(cycle[readerState.theme] || 'light');
}

const THEME_LABELS = { light: 'Light', dark: 'Dark', warm: 'Warm' };

function setReaderTheme(theme) {
    readerState.theme = theme;
    document.body.setAttribute('data-theme', theme);
    if (elements.themeToggle) {
        elements.themeToggle.textContent = THEME_LABELS[theme] || theme;
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

    let renderedHtml;
    if (payload.isEpub) {
        // EPUB content is pre-processed (images → data URIs, scripts stripped)
        // Only strip event handlers; preserve inline styles for fidelity
        renderedHtml = sanitizeEpubHtml(payload.html || '');
        if (elements.readerSource) elements.readerSource.style.display = 'none';
    } else if (payload.preserveFormatting) {
        // Library articles arrive pre-sanitized from the extension with user edits
        // (highlights, colors, font sizes) baked into inline styles. Re-running the
        // article sanitizer would strip every `style` attribute and erase those edits.
        renderedHtml = sanitizeEpubHtml(payload.html || '');
        if (elements.readerSource) elements.readerSource.style.display = '';
        removeEpubStyles();
    } else {
        renderedHtml = sanitizeArticleHtml(payload.html || '', sourceUrl);
        if (elements.readerSource) elements.readerSource.style.display = '';
        removeEpubStyles();
    }

    // Store payload for EPUB download
    readerState.currentArticle = payload;

    // Reset pagination whenever new content arrives
    paginationState.enabled = false;
    paginationState.pages = [];
    paginationState.currentPage = 0;
    hidePaginationBars();

    // Multi-chapter EPUBs get paginated; everything else renders directly
    if (payload.isEpub) {
        const pages = splitIntoPages(renderedHtml);
        if (pages) {
            setupPagination(pages);
        } else if (elements.articleRoot) {
            elements.articleRoot.innerHTML = renderedHtml;
        }
    } else if (elements.articleRoot) {
        elements.articleRoot.innerHTML = renderedHtml;
    }

    // Enable download button
    if (elements.downloadEpubBtn) {
        elements.downloadEpubBtn.disabled = false;
    }

    setReaderStatus('Content loaded successfully.', 'success');

    // Enable edit button; exit any active edit session cleanly
    if (elements.editToggleBtn) elements.editToggleBtn.disabled = false;
    if (editorState.active) exitEditMode(false);

    // Show the Versions button only for library articles (those with an articleId)
    updateVersionButtonLabel();
}

function updateVersionButtonLabel() {
    const btn = elements.versionHistoryBtn;
    if (!btn) return;
    const a = readerState.currentArticle;
    if (a?.articleId) {
        const v = a.versionCount;
        btn.textContent = v && v > 0 ? 'v' + v : 'Versions';
        btn.style.display = '';
        btn.disabled = false;
    } else {
        btn.style.display = 'none';
    }
}

function convertPlainTextToHtml(text) {
    const escaped = escapeHtml(text);
    const paragraphs = escaped
        .split(/\n\s*\n/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para) => `<p>${para.replace(/\n+/g, '<br />')}</p>`)
        .join('\n');

    return paragraphs || '<p></p>';
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Byte-identical port of the extension's content hash (background.js:393-400).
// Output is 1–8 hex chars (no zero padding); operates on UTF-16 code units.
function simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
        hash |= 0;
    }
    return (hash >>> 0).toString(16);
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

        // 4. Extract and download images (before creating content.opf)
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(html, 'text/html');
        const images = htmlDoc.querySelectorAll('img');
        const imageManifest = [];
        let imageIndex = 0;

        for (const img of images) {
            const imgSrc = img.getAttribute('src');
            if (imgSrc && imgSrc.startsWith('data:')) {
                try {
                    // Parse data URI: data:<mime>;base64,<data>
                    const [header, b64data] = imgSrc.split(',', 2);
                    const mime = header.replace('data:', '').replace(';base64', '') || 'image/png';
                    const ext = mime.split('/')[1] || 'png';
                    const byteChars = atob(b64data);
                    const byteArr = new Uint8Array(byteChars.length);
                    for (let j = 0; j < byteChars.length; j++) byteArr[j] = byteChars.charCodeAt(j);
                    const blob = new Blob([byteArr], { type: mime });
                    const imgFilename = `images/img${imageIndex}.${ext}`;
                    zip.file(`OEBPS/${imgFilename}`, blob);
                    imageManifest.push({ id: `img${imageIndex}`, href: imgFilename, type: mime });
                    img.setAttribute('src', imgFilename);
                    imageIndex++;
                } catch (error) {
                    console.warn('Failed to embed data URI image:', error);
                }
                continue;
            }
            if (imgSrc && (imgSrc.startsWith('http://') || imgSrc.startsWith('https://'))) {
                try {
                    const response = await fetch(imgSrc);
                    const blob = await response.blob();
                    const ext = imgSrc.split('.').pop().split('?')[0].toLowerCase();
                    const validExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) ? ext : 'jpg';
                    const imgFilename = `images/img${imageIndex}.${validExt}`;
                    const mediaType = blob.type || `image/${validExt === 'jpg' ? 'jpeg' : validExt}`;
                    
                    zip.file(`OEBPS/${imgFilename}`, blob);
                    imageManifest.push({ id: `img${imageIndex}`, href: imgFilename, type: mediaType });
                    
                    // Update img src in HTML to reference local file
                    img.setAttribute('src', imgFilename);
                    imageIndex++;
                } catch (error) {
                    console.warn('Failed to download image:', imgSrc, error);
                    // Keep original URL if download fails
                }
            }
        }

        // 6. Convert HTML to valid XHTML
        const xhtmlContent = convertToXhtml(htmlDoc.body.innerHTML);

        // 7. Update content.opf with image manifest
        const imageManifestItems = imageManifest.map(img => 
            `    <item id="${img.id}" href="${img.href}" media-type="${img.type}"/>`
        ).join('\n');

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
${imageManifestItems}
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`;
        zip.file('OEBPS/content.opf', contentOpf);

        // 8. Add OEBPS/content.xhtml
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

function sanitizeInlineStyle(styleValue) {
    if (!styleValue) return '';
    const dangerous = /expression\s*\(|javascript\s*:|url\s*\(/i;
    if (dangerous.test(styleValue)) return '';
    const allowed = new Set(['color', 'background-color', 'font-size', 'font-weight', 'font-style', 'text-decoration', 'text-align', 'font-family']);
    const safe = styleValue.split(';')
        .map((s) => s.trim()).filter(Boolean)
        .filter((pair) => {
            const [prop, ...rest] = pair.split(':');
            const val = rest.join(':').trim();
            return allowed.has(prop.trim().toLowerCase()) && !dangerous.test(val);
        });
    return safe.join('; ');
}

function convertToXhtml(html) {
    if (!html) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove problematic elements
    const removeElements = doc.querySelectorAll('script, style, iframe, object, embed');
    removeElements.forEach(el => el.remove());

    // Clean up all elements - remove invalid attributes
    doc.querySelectorAll('*').forEach(el => {
        const attrsToRemove = [];
        for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            const name = attr.name.toLowerCase();

            if (name === 'style') {
                const sanitized = sanitizeInlineStyle(attr.value);
                if (sanitized) {
                    attr.value = sanitized;
                } else {
                    attrsToRemove.push(attr.name);
                }
            } else if (name.startsWith('on') || name.startsWith('data-') ||
                name.includes(':') || !name.match(/^[a-z][a-z0-9-]*$/i)) {
                attrsToRemove.push(attr.name);
            }
        }
        attrsToRemove.forEach(attr => el.removeAttribute(attr));
        
        // Ensure required attributes for certain elements
        if (el.tagName.toLowerCase() === 'img' && !el.hasAttribute('alt')) {
            el.setAttribute('alt', '');
        }
        
        // Clean attribute values - escape quotes
        for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            if (attr.value) {
                attr.value = attr.value.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
            }
        }
    });
    
    // Serialize to string
    let xhtml = doc.body.innerHTML;
    
    // XHTML compliance fixes - handle all void elements
    const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
                          'link', 'meta', 'param', 'source', 'track', 'wbr'];
    
    voidElements.forEach(tag => {
        // Match opening tags that aren't already self-closed
        const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
        xhtml = xhtml.replace(regex, `<${tag}$1 />`);
    });
    
    // Clean up any remaining issues
    xhtml = xhtml
        .replace(/&nbsp;/g, '&#160;')
        .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
        // Fix double slashes
        .replace(/\/\s*\/>/g, ' />')
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

// Screen-blocking spinner for in-flight network actions where the user
// shouldn't be able to click anything else (e.g. delete, restore).
function showBusyOverlay(label) {
    if (!elements.busyOverlay) return;
    if (elements.busyOverlayLabel && label) {
        elements.busyOverlayLabel.textContent = label;
    }
    elements.busyOverlay.hidden = false;
}

function hideBusyOverlay() {
    if (!elements.busyOverlay) return;
    elements.busyOverlay.hidden = true;
}

// ─── EPUB Reader ─────────────────────────────────────────────────────────────

async function parseAndLoadEpub(file) {
    setReaderStatus('Loading EPUB…', 'success');

    try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Locate OPF via META-INF/container.xml
        const containerFile = zip.file('META-INF/container.xml');
        if (!containerFile) throw new Error('Missing META-INF/container.xml');
        const opfPath = parseContainerXml(await containerFile.async('text'));
        if (!opfPath) throw new Error('Cannot locate OPF file');

        const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
        const opfFile = resolveZipFile(zip, opfPath);
        if (!opfFile) throw new Error('OPF not found: ' + opfPath);
        const { title, author, manifest, spineOrder } = parseOpfXml(await opfFile.async('text'), opfDir);

        // Build asset map: images + fonts → data URIs
        const assetMap = {};
        const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
        const fontMimeTypes = ['font/woff', 'font/woff2', 'font/ttf', 'font/otf', 'application/font-woff',
                               'application/x-font-ttf', 'application/x-font-opentype', 'application/vnd.ms-fontobject'];

        for (const item of Object.values(manifest)) {
            if (!imageMimeTypes.includes(item.mediaType) && !fontMimeTypes.includes(item.mediaType)) continue;
            const f = resolveZipFile(zip, item.fullPath);
            if (!f) continue;
            const b64 = await f.async('base64');
            const dataUri = `data:${item.mediaType};base64,${b64}`;
            assetMap[item.fullPath] = dataUri;
            assetMap[item.href] = dataUri;
            // Also index by bare filename for resilient resolution
            const fname = item.href.split('/').pop();
            if (!assetMap[fname]) assetMap[fname] = dataUri;
        }

        // Extract and accumulate CSS (external files from manifest)
        let allCss = '';
        for (const item of Object.values(manifest)) {
            if (item.mediaType !== 'text/css') continue;
            const f = resolveZipFile(zip, item.fullPath);
            if (!f) continue;
            const cssDir = item.fullPath.includes('/') ? item.fullPath.substring(0, item.fullPath.lastIndexOf('/') + 1) : '';
            allCss += resolveEpubCssUrls(await f.async('text'), cssDir, assetMap) + '\n';
        }

        // Extract HTML body content in spine order
        let combinedHtml = '';
        const seenPaths = new Set();
        console.log('[EPUB] spine items to process:', spineOrder.length, spineOrder);
        for (const idref of spineOrder) {
            const item = manifest[idref];
            if (!item) continue;
            const mt = item.mediaType || '';
            if (!mt.includes('html') && !mt.includes('xhtml') && !item.fullPath.match(/\.(x?html?)$/i)) continue;
            // Skip if we've already processed this exact file (duplicate idref or two idrefs → same file)
            const normPath = item.fullPath.toLowerCase();
            if (seenPaths.has(normPath)) {
                console.log('[EPUB] skipping duplicate path:', item.fullPath);
                continue;
            }
            seenPaths.add(normPath);
            const f = resolveZipFile(zip, item.fullPath);
            if (!f) continue;
            const fileDir = item.fullPath.includes('/') ? item.fullPath.substring(0, item.fullPath.lastIndexOf('/') + 1) : '';
            const { html: chapterHtml, css: chapterCss } = extractEpubChapter(await f.async('text'), fileDir, assetMap);
            console.log('[EPUB] chapter:', item.fullPath, '— text preview:', chapterHtml.replace(/<[^>]+>/g, ' ').slice(0, 120).trim());
            if (chapterCss) allCss += chapterCss + '\n';
            if (chapterHtml) combinedHtml += `<div data-rp>${chapterHtml}</div>\n`;
        }

        injectEpubStyles(allCss);

        const payload = {
            title: title || file.name.replace(/\.epub$/i, ''),
            byline: author || '',
            siteName: '',
            sourceUrl: '',
            html: combinedHtml,
            isEpub: true
        };

        if (window.location.hash !== '#/reader') window.location.hash = '#/reader';
        renderReaderContent(payload);

    } catch (err) {
        console.error('EPUB parse error:', err);
        setReaderStatus('Failed to load EPUB: ' + err.message, 'error');
    }
}

function parseContainerXml(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const rootfile = doc.querySelector('rootfile');
    return rootfile ? rootfile.getAttribute('full-path') : null;
}

function parseOpfXml(xml, opfDir) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');

    // Metadata (try both namespaced and plain queries)
    const titleEl = doc.querySelector('metadata title') || doc.querySelector('title');
    const authorEl = doc.querySelector('metadata creator') || doc.querySelector('creator');
    const title = titleEl ? titleEl.textContent.trim() : '';
    const author = authorEl ? authorEl.textContent.trim() : '';

    // Manifest: id → { id, href, mediaType, fullPath }
    const manifest = {};
    doc.querySelectorAll('manifest item').forEach((item) => {
        const id = item.getAttribute('id');
        const href = decodeURIComponent(item.getAttribute('href') || '');
        const mediaType = item.getAttribute('media-type') || '';
        if (id && href) {
            manifest[id] = { id, href, mediaType, fullPath: opfDir + href };
        }
    });

    // Identify the nav document (EPUB 3: properties="nav"; EPUB 2: guide type="toc")
    const navItemIds = new Set();
    doc.querySelectorAll('manifest item').forEach((item) => {
        const props = (item.getAttribute('properties') || '').split(/\s+/);
        if (props.includes('nav')) navItemIds.add(item.getAttribute('id'));
    });
    doc.querySelectorAll('guide reference').forEach((ref) => {
        const type = (ref.getAttribute('type') || '').toLowerCase();
        if (type === 'toc' || type === 'ncx') {
            const href = ref.getAttribute('href') || '';
            // Match against manifest hrefs
            Object.values(manifest).forEach((m) => {
                if (m.href === href || m.href.split('#')[0] === href) navItemIds.add(m.id);
            });
        }
    });

    // Spine reading order — skip non-linear and nav items
    const spineOrder = [];
    doc.querySelectorAll('spine itemref').forEach((itemref) => {
        const idref = itemref.getAttribute('idref');
        if (!idref) return;
        if ((itemref.getAttribute('linear') || 'yes').toLowerCase() === 'no') return;
        if (navItemIds.has(idref)) return;
        spineOrder.push(idref);
    });

    return { title, author, manifest, spineOrder };
}

function resolveZipFile(zip, path) {
    // Try the exact path, then without leading ./, then URL-decoded
    const normalised = path.replace(/\\/g, '/').replace(/^\.\//, '');
    return zip.file(normalised) || zip.file(decodeURIComponent(normalised)) || null;
}

function resolveRelativePath(baseDir, relativePath) {
    const parts = (baseDir + relativePath).split('/');
    const out = [];
    for (const p of parts) {
        if (p === '..') out.pop();
        else if (p !== '.') out.push(p);
    }
    return out.join('/');
}

function resolveEpubCssUrls(css, cssDir, assetMap) {
    return css.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi, (match, _q, val) => {
        if (val.startsWith('data:') || val.startsWith('http')) return match;
        const decoded = decodeURIComponent(val);
        const resolved = resolveRelativePath(cssDir, decoded);
        const dataUri = assetMap[resolved] || assetMap[decoded] || assetMap[decoded.split('/').pop()];
        return dataUri ? `url("${dataUri}")` : match;
    });
}

function extractEpubChapter(xhtmlText, fileDir, assetMap) {
    // Parse as XHTML first, fall back to HTML
    let doc = new DOMParser().parseFromString(xhtmlText, 'application/xhtml+xml');
    if (doc.querySelector('parsererror')) {
        doc = new DOMParser().parseFromString(xhtmlText, 'text/html');
    }

    // Collect inline <style> from <head>
    let css = '';
    doc.querySelectorAll('head style').forEach((s) => {
        css += resolveEpubCssUrls(s.textContent, fileDir, assetMap) + '\n';
    });

    // Remove dangerous elements
    doc.querySelectorAll('script, iframe, object, embed, form, input, button, link, meta').forEach((el) => el.remove());

    // Strip event handlers; keep style attributes
    doc.querySelectorAll('*').forEach((el) => {
        [...el.attributes].forEach((attr) => {
            const n = attr.name.toLowerCase();
            if (n.startsWith('on')) el.removeAttribute(attr.name);
            if ((n === 'href' || n === 'src') && attr.value.trim().toLowerCase().startsWith('javascript:')) {
                el.removeAttribute(attr.name);
            }
        });
    });

    // Resolve image src → data URI
    doc.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('data:')) return;
        const decoded = decodeURIComponent(src);
        const resolved = resolveRelativePath(fileDir, decoded);
        const dataUri = assetMap[resolved] || assetMap[decoded] || assetMap[decoded.split('/').pop()];
        if (dataUri) img.setAttribute('src', dataUri);
    });

    // Resolve SVG <image href> / xlink:href
    doc.querySelectorAll('image').forEach((img) => {
        const href = img.getAttribute('href') || img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        if (!href || href.startsWith('data:')) return;
        const resolved = resolveRelativePath(fileDir, decodeURIComponent(href));
        const dataUri = assetMap[resolved] || assetMap[href];
        if (dataUri) {
            img.setAttribute('href', dataUri);
            img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUri);
        }
    });

    // Resolve inline style background-image url() references
    doc.querySelectorAll('[style]').forEach((el) => {
        const original = el.getAttribute('style');
        const patched = resolveEpubCssUrls(original, fileDir, assetMap);
        if (patched !== original) el.setAttribute('style', patched);
    });

    const body = doc.querySelector('body');
    return { html: body ? body.innerHTML : '', css };
}

function sanitizeEpubHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, iframe, object, embed, form').forEach((el) => el.remove());
    doc.querySelectorAll('*').forEach((el) => {
        [...el.attributes].forEach((attr) => {
            const n = attr.name.toLowerCase();
            if (n.startsWith('on')) el.removeAttribute(attr.name);
            if ((n === 'href' || n === 'src') && attr.value.trim().toLowerCase().startsWith('javascript:')) {
                el.removeAttribute(attr.name);
            }
        });
    });
    return doc.body.innerHTML;
}

function injectEpubStyles(css) {
    removeEpubStyles();
    const style = document.createElement('style');
    style.id = 'epub-reader-styles';
    // Scoped EPUB CSS, followed by layout overrides so EPUB body/html rules can't break
    // reader centering (e.g. "body { margin: 0 }" scopes to "#articleRoot { margin: 0 }"
    // which beats the class-level "margin: 0 auto" rule via ID specificity).
    const scoped = css.trim() ? scopeEpubCss(css, '#articleRoot') : '';
    style.textContent = scoped + `
#articleRoot {
    margin-left: auto !important;
    margin-right: auto !important;
    width: 100% !important;
    max-width: 900px !important;
    float: none !important;
    position: static !important;
    box-sizing: border-box !important;
}
#articleRoot [data-rp] {
    width: 100% !important;
    max-width: 100% !important;
    float: none !important;
    box-sizing: border-box !important;
}
#articleRoot img {
    max-width: 100% !important;
    height: auto !important;
}`;
    document.head.appendChild(style);
}

function removeEpubStyles() {
    const el = document.getElementById('epub-reader-styles');
    if (el) el.remove();
}

function scopeEpubCss(css, scope) {
    css = css.replace(/\/\*[\s\S]*?\*\//g, ''); // strip comments
    const result = [];
    let i = 0;

    while (i < css.length) {
        while (i < css.length && /\s/.test(css[i])) i++;
        if (i >= css.length) break;

        if (css[i] === '@') {
            const atMatch = css.substring(i).match(/^@([\w-]+)/);
            const atName = (atMatch ? atMatch[1] : '').toLowerCase();

            if (['font-face', 'page', 'charset', 'import', 'namespace'].includes(atName)) {
                // Global @-rules: keep unchanged
                const end = findCssRuleEnd(css, i);
                result.push(css.substring(i, end).trim());
                i = end;
            } else if (['media', 'supports'].includes(atName)) {
                // Scope selectors inside the block
                const braceIdx = css.indexOf('{', i);
                if (braceIdx === -1) break;
                const header = css.substring(i, braceIdx + 1);
                i = braceIdx + 1;
                let depth = 1;
                const contentStart = i;
                while (i < css.length && depth > 0) {
                    if (css[i] === '{') depth++;
                    else if (css[i] === '}') depth--;
                    i++;
                }
                const inner = css.substring(contentStart, i - 1);
                result.push(`${header}\n${scopeEpubCss(inner, scope)}\n}`);
            } else {
                // @keyframes and others: keep inner content as-is
                const braceIdx = css.indexOf('{', i);
                if (braceIdx === -1) break;
                const header = css.substring(i, braceIdx + 1);
                i = braceIdx + 1;
                let depth = 1;
                const contentStart = i;
                while (i < css.length && depth > 0) {
                    if (css[i] === '{') depth++;
                    else if (css[i] === '}') depth--;
                    i++;
                }
                result.push(`${header}\n${css.substring(contentStart, i - 1)}\n}`);
            }
        } else {
            const braceIdx = css.indexOf('{', i);
            if (braceIdx === -1) break;
            const closeBrace = css.indexOf('}', braceIdx);
            if (closeBrace === -1) break;

            const selectorText = css.substring(i, braceIdx).trim();
            const declarations = css.substring(braceIdx, closeBrace + 1);

            if (selectorText) {
                const scoped = selectorText.split(',').map((sel) => {
                    sel = sel.trim();
                    if (!sel) return '';
                    if (sel === 'html' || sel === 'body' || sel === ':root') return scope;
                    if (/^(html|body)\s/.test(sel)) return scope + ' ' + sel.replace(/^(html|body)\s+/, '');
                    return `${scope} ${sel}`;
                }).filter(Boolean).join(', ');
                if (scoped) result.push(`${scoped} ${declarations}`);
            }

            i = closeBrace + 1;
        }
    }

    return result.join('\n');
}

function findCssRuleEnd(css, start) {
    let i = start;
    while (i < css.length) {
        if (css[i] === ';') return i + 1;
        if (css[i] === '{') {
            let depth = 0;
            while (i < css.length) {
                if (css[i] === '{') depth++;
                else if (css[i] === '}') { depth--; if (depth === 0) return i + 1; }
                i++;
            }
            return i;
        }
        i++;
    }
    return i;
}

// ─── Library (Supabase article sidebar) ──────────────────────────────────

function openSidebar() {
    if (!elements.articleSidebar) return;
    elements.articleSidebar.hidden = false;
    if (elements.libraryToggleBtn) elements.libraryToggleBtn.classList.add('edit-active');
    // Lazy-load library on open if signed in and not already loaded
    if (authState.isLoggedIn && !libraryState.loaded && !libraryState.loading) loadLibrary();
}

function closeSidebar() {
    if (!elements.articleSidebar) return;
    elements.articleSidebar.hidden = true;
    if (elements.libraryToggleBtn) elements.libraryToggleBtn.classList.remove('edit-active');
}

function toggleSidebar() {
    if (!elements.articleSidebar) return;
    if (elements.articleSidebar.hidden) {
        openSidebar();
    } else {
        closeSidebar();
    }
}

async function loadLibrary() {
    if (!authState.isLoggedIn || !authState.idToken) {
        renderSidebarSignInPrompt();
        return;
    }
    // Idempotency: don't refetch if already loaded or in-flight. The Refresh
    // button explicitly resets libraryState.loaded = false before calling, so
    // it still triggers a fresh fetch.
    if (libraryState.loaded || libraryState.loading) return;

    libraryState.loading = true;
    libraryState.error = null;
    renderSidebarLoading();

    try {
        const articles = await fetchSupabaseArticles();
        libraryState.articles = articles;
        libraryState.loaded = true;
        renderSidebarArticles(articles);
    } catch (err) {
        libraryState.error = err.message;
        renderSidebarState(err.message, true);
    } finally {
        libraryState.loading = false;
    }
}

async function fetchSupabaseArticles() {
    const resp = await fetch('/api/saved-list', {
        headers: { 'Authorization': 'Bearer ' + authState.idToken }
    });
    if (!resp.ok) {
        if (resp.status === 401) handleExpiredSession();
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load articles (' + resp.status + ')');
    }
    return resp.json();
}

async function fetchSignedUrl(contentPath) {
    const resp = await fetch('/api/saved-content?' + new URLSearchParams({ content_path: contentPath }), {
        headers: { 'Authorization': 'Bearer ' + authState.idToken }
    });
    if (!resp.ok) {
        if (resp.status === 401) handleExpiredSession();
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get article URL (' + resp.status + ')');
    }
    const data = await resp.json();
    return data.signedUrl;
}

async function openArticleFromLibrary(article) {
    if (!article?.content_path) return;
    setReaderStatus('Loading article…', 'success');

    try {
        const signedUrl = await fetchSignedUrl(article.content_path);
        const cacheBustedUrl = article.synced_at
            ? signedUrl + (signedUrl.includes('?') ? '&' : '?') + 'v=' + article.synced_at
            : signedUrl;
        const resp = await fetch(cacheBustedUrl);
        if (!resp.ok) throw new Error('Failed to fetch article (' + resp.status + ')');
        const rawHtml = await resp.text();

        const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
        const bodyHtml = doc.body ? doc.body.innerHTML : rawHtml;

        const payload = {
            title: article.title || 'Untitled',
            byline: '',
            siteName: article.site_name || '',
            sourceUrl: article.url || '',
            html: bodyHtml,
            isEpub: false,
            preserveFormatting: true,
            // Supabase identity — used by save / versions / restore flows
            articleId: article.id,
            contentPath: article.content_path,
            syncedAt: article.synced_at,
            versionCount: article.version_count ?? null,
            // Change detection: hash of raw stored file (matches articles.content_hash exactly)
            // plus snapshots for client-side dirty checks.
            rawSavedHtml: rawHtml,
            rawSavedHash: simpleHash(rawHtml),
            initialBodyHtml: bodyHtml, // overwritten below to the browser-reserialized form
            _initialTitle: article.title || 'Untitled',
            _initialSiteName: article.site_name || ''
        };

        renderReaderContent(payload);

        // Capture the browser-serialized form (what the editor will read on save) so
        // a no-edit Save can be detected client-side and skip the network round-trip.
        if (elements.articleRoot) {
            payload.initialBodyHtml = elements.articleRoot.innerHTML;
            // Also keep currentArticle.html in sync with this serialized form so the
            // editor reads from and writes to the same representation.
            payload.html = elements.articleRoot.innerHTML;
        }

        // On mobile, close sidebar after opening article
        if (window.innerWidth <= 640) closeSidebar();

    } catch (err) {
        setReaderStatus('Failed to load article: ' + err.message, 'error');
    }
}

async function saveArticleVersion() {
    const a = readerState.currentArticle;
    if (!a?.articleId || !authState.idToken) return;

    // Client-side dirty check: if the editor body matches what we loaded and the title
    // / siteName are unchanged, no save is needed.
    const bodyUnchanged = a.html === a.initialBodyHtml;
    // titleInitial / siteNameInitial captured when the article was loaded — fall back to
    // current values so legacy payloads don't false-positive as "changed".
    const titleUnchanged = (a._initialTitle ?? a.title) === a.title;
    const siteUnchanged = (a._initialSiteName ?? a.siteName) === a.siteName;
    if (bodyUnchanged && titleUnchanged && siteUnchanged) {
        setReaderStatus('No changes to save.', 'success');
        return;
    }

    setReaderStatus('Saving…', 'success');
    try {
        const resp = await fetch('/api/saved-save', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + authState.idToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                article_id: a.articleId,
                title: a.title,
                site_name: a.siteName,
                html: a.html
            })
        });
        if (!resp.ok) {
            if (resp.status === 401) handleExpiredSession();
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.error || 'Save failed (' + resp.status + ')');
        }
        const data = await resp.json();

        a.versionCount = data.version;
        a.syncedAt = data.synced_at;
        if (data.content_path) a.contentPath = data.content_path;
        a.initialBodyHtml = a.html;
        a._initialTitle = a.title;
        a._initialSiteName = a.siteName;

        if (data.unchanged && data.titleUpdated) {
            setReaderStatus('Title updated.', 'success');
        } else if (data.unchanged) {
            setReaderStatus('No changes to save.', 'success');
        } else {
            setReaderStatus('Saved as v' + data.version + '.', 'success');
        }

        updateVersionButtonLabel();

        // Reflect new state in the library sidebar entry without re-fetching everything
        const idx = libraryState.articles.findIndex((x) => x.id === a.articleId);
        if (idx >= 0) {
            libraryState.articles[idx].version_count = data.version;
            libraryState.articles[idx].synced_at = data.synced_at;
            libraryState.articles[idx].title = a.title;
            if (data.content_path) libraryState.articles[idx].content_path = data.content_path;
        }
    } catch (err) {
        setReaderStatus('Save failed: ' + err.message, 'error');
    }
}

function renderSidebarLoading() {
    if (!elements.sidebarList) return;
    elements.sidebarList.innerHTML = '<div class="sidebar-state">Loading…</div>';
}

function renderSidebarState(message, isError) {
    if (!elements.sidebarList) return;
    elements.sidebarList.innerHTML = `<div class="sidebar-state${isError ? ' sidebar-state--error' : ''}">${escapeHtml(message)}</div>`;
}

function renderSidebarSignInPrompt() {
    if (!elements.sidebarList) return;
    elements.sidebarList.innerHTML =
        '<div class="sidebar-state sidebar-state--prompt">'
        + 'Please sign in with Google to see your saved articles.'
        + '</div>';
}

function renderSidebarArticles(articles) {
    if (!elements.sidebarList) return;
    if (!articles.length) {
        elements.sidebarList.innerHTML = '<div class="sidebar-state">No saved articles yet.</div>';
        return;
    }
    const trashSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>';
    elements.sidebarList.innerHTML = articles.map((a, i) => {
        const date = a.added_date ? new Date(a.added_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const meta = [a.site_name, date].filter(Boolean).join(' · ');
        return `<div class="sidebar-article-row">
            <button class="sidebar-article" data-index="${i}" data-action="open" type="button">
                <span class="sidebar-article-title">${escapeHtml(a.title || 'Untitled')}</span>
                <span class="sidebar-article-meta">${escapeHtml(meta)}</span>
            </button>
            <button class="sidebar-article-delete" data-index="${i}" data-action="delete" type="button" aria-label="Delete article" title="Delete">${trashSvg}</button>
        </div>`;
    }).join('');
}

function setupLibraryEventListeners() {
    if (elements.libraryToggleBtn) {
        elements.libraryToggleBtn.addEventListener('click', toggleSidebar);
    }
    if (elements.sidebarCloseBtn) {
        elements.sidebarCloseBtn.addEventListener('click', closeSidebar);
    }
    if (elements.sidebarRefreshBtn) {
        elements.sidebarRefreshBtn.addEventListener('click', () => {
            libraryState.loaded = false;
            loadLibrary();
        });
    }
    if (elements.sidebarNewBtn) {
        elements.sidebarNewBtn.addEventListener('click', createNewArticle);
    }
    if (elements.sidebarList) {
        elements.sidebarList.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const idx = parseInt(btn.dataset.index, 10);
            const article = libraryState.articles[idx];
            if (!article) return;
            if (btn.dataset.action === 'delete') {
                deleteArticleFromLibrary(article, idx);
            } else {
                openArticleFromLibrary(article);
            }
        });
    }
}

async function deleteArticleFromLibrary(article, index) {
    if (!article?.id) return;
    if (!confirm(`Delete "${article.title || 'Untitled'}"? This cannot be undone.`)) return;

    showBusyOverlay('Deleting…');
    try {
        const resp = await fetch('/api/saved-delete?' + new URLSearchParams({ article_id: article.id }), {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authState.idToken }
        });
        if (!resp.ok) {
            if (resp.status === 401) handleExpiredSession();
            const data = await resp.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to delete (' + resp.status + ')');
        }
        libraryState.articles.splice(index, 1);
        renderSidebarArticles(libraryState.articles);
        setReaderStatus('Article deleted', 'success');
    } catch (err) {
        setReaderStatus('Failed to delete: ' + err.message, 'error');
    } finally {
        hideBusyOverlay();
    }
}

async function createNewArticle() {
    if (!authState.isLoggedIn || !authState.idToken) return;

    showBusyOverlay('Creating…');
    try {
        const resp = await fetch('/api/saved-create', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + authState.idToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: 'Untitled' })
        });
        if (!resp.ok) {
            if (resp.status === 401) handleExpiredSession();
            const data = await resp.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to create (' + resp.status + ')');
        }
        const article = await resp.json();
        // Optimistic prepend so the sidebar reflects the new draft immediately —
        // no need to wait for a full refetch.
        libraryState.articles.unshift(article);
        renderSidebarArticles(libraryState.articles);
        hideBusyOverlay();

        // Open in the reader, then drop straight into edit mode so the user can
        // start typing without an extra click.
        await openArticleFromLibrary(article);
        if (!editorState.active) enterEditMode();
        // Park the cursor inside the empty paragraph
        if (elements.articleRoot) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            const range = document.createRange();
            range.selectNodeContents(elements.articleRoot);
            range.collapse(true);
            sel.addRange(range);
        }
        setReaderStatus('Empty draft created — start writing.', 'success');
    } catch (err) {
        hideBusyOverlay();
        setReaderStatus('Failed to create: ' + err.message, 'error');
    }
}

// ─── Version History ─────────────────────────────────────────────────────────

async function openVersionHistory() {
    const a = readerState.currentArticle;
    if (!a?.articleId) return;
    if (!elements.versionHistoryModal || !elements.versionList) return;

    elements.versionHistoryModal.hidden = false;
    elements.versionList.innerHTML = '<div class="version-state">Loading…</div>';

    try {
        const resp = await fetch('/api/saved-versions?' + new URLSearchParams({ article_id: a.articleId }), {
            headers: { 'Authorization': 'Bearer ' + authState.idToken }
        });
        if (!resp.ok) {
            if (resp.status === 401) handleExpiredSession();
            const data = await resp.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to load versions (' + resp.status + ')');
        }
        const versions = await resp.json();
        renderVersionList(versions);
    } catch (err) {
        elements.versionList.innerHTML =
            '<div class="version-state version-state--error">' + escapeHtml(err.message) + '</div>';
    }
}

function renderVersionList(versions) {
    if (!elements.versionList) return;
    if (!versions.length) {
        elements.versionList.innerHTML = '<div class="version-state">No version history yet.</div>';
        return;
    }
    const currentVN = readerState.currentArticle?.versionCount;
    elements.versionList.innerHTML = versions.map((v) => {
        const isCurrent = v.version_number === currentVN;
        const date = v.created_at ? new Date(v.created_at).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
        }) : '';
        const source = v.saved_from === 'chrome_extension' ? 'Extension' : 'Web App';
        const tags = [date, source];
        if (v.is_original_capture) tags.push('Original capture');
        const meta = tags.filter(Boolean).join(' · ');
        const label = 'v' + v.version_number + (isCurrent ? ' (current)' : '');
        const restoreBtn = isCurrent
            ? ''
            : '<button class="version-restore-btn" data-version-id="' + escapeHtml(v.id) + '" data-version-number="' + v.version_number + '" type="button">Restore</button>';
        return '<div class="version-row' + (isCurrent ? ' version-row--current' : '') + '">'
            + '<div class="version-row-main">'
            + '<span class="version-label">' + escapeHtml(label) + '</span>'
            + '<span class="version-meta">' + escapeHtml(meta) + '</span>'
            + '</div>'
            + restoreBtn
            + '</div>';
    }).join('');
}

function closeVersionModal() {
    if (elements.versionHistoryModal) elements.versionHistoryModal.hidden = true;
}

async function restoreVersion(versionId, versionNumber) {
    const a = readerState.currentArticle;
    if (!a?.articleId || !versionId) return;
    if (!confirm('Restore v' + versionNumber + '? A new version will be created with this content.')) return;

    setReaderStatus('Restoring v' + versionNumber + '…', 'success');
    try {
        const resp = await fetch('/api/saved-restore', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + authState.idToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ article_id: a.articleId, version_id: versionId })
        });
        if (!resp.ok) {
            if (resp.status === 401) handleExpiredSession();
            const data = await resp.json().catch(() => ({}));
            throw new Error(data.error || 'Restore failed (' + resp.status + ')');
        }
        const data = await resp.json();
        closeVersionModal();

        // Reflect new state in the library sidebar so the subsequent re-load uses fresh metadata
        const idx = libraryState.articles.findIndex((x) => x.id === a.articleId);
        if (idx >= 0) {
            libraryState.articles[idx].version_count = data.version;
            libraryState.articles[idx].synced_at = data.synced_at;
            if (data.content_path) libraryState.articles[idx].content_path = data.content_path;
            await openArticleFromLibrary(libraryState.articles[idx]);
        }

        if (data.unchanged) {
            setReaderStatus('Already at this version.', 'success');
        } else {
            setReaderStatus('Restored — now at v' + data.version + '.', 'success');
        }
    } catch (err) {
        setReaderStatus('Restore failed: ' + err.message, 'error');
    }
}

function setupVersionHistoryListeners() {
    if (elements.versionHistoryBtn) {
        elements.versionHistoryBtn.addEventListener('click', openVersionHistory);
    }
    if (elements.versionModalClose) {
        elements.versionModalClose.addEventListener('click', closeVersionModal);
    }
    if (elements.versionHistoryModal) {
        // Click on overlay (outside the modal card) closes
        elements.versionHistoryModal.addEventListener('click', (e) => {
            if (e.target === elements.versionHistoryModal) closeVersionModal();
        });
    }
    if (elements.versionList) {
        elements.versionList.addEventListener('click', (e) => {
            const btn = e.target.closest('.version-restore-btn');
            if (!btn) return;
            const id = btn.dataset.versionId;
            const num = parseInt(btn.dataset.versionNumber, 10);
            if (id) restoreVersion(id, num);
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.versionHistoryModal && !elements.versionHistoryModal.hidden) {
            closeVersionModal();
        }
    });
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function splitIntoPages(sanitizedHtml) {
    const doc = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
    // Use a data attribute we control — EPUB content cannot accidentally contain [data-rp]
    // so querySelectorAll returns only our wrappers, never any nested EPUB-owned divs
    const chapters = Array.from(doc.body.querySelectorAll(':scope > [data-rp]'));
    if (chapters.length <= 1) return null;
    return chapters.map((ch) => ch.outerHTML);
}

function setupPagination(pages) {
    paginationState.enabled = true;
    paginationState.pages = pages;
    paginationState.currentPage = 0;
    renderPage(0);
}

function renderPage(pageIndex) {
    paginationState.currentPage = pageIndex;
    if (elements.articleRoot) {
        elements.articleRoot.innerHTML = paginationState.pages[pageIndex] || '';
    }
    const scrollEl = document.querySelector('.reader-scroll');
    if (scrollEl) scrollEl.scrollTop = 0;
    renderPaginationBars();
}

function hidePaginationBars() {
    if (elements.paginationTop) elements.paginationTop.hidden = true;
    if (elements.paginationBottom) elements.paginationBottom.hidden = true;
}

function renderPaginationBars() {
    const html = buildPaginationHtml(paginationState.currentPage, paginationState.pages.length);
    [elements.paginationTop, elements.paginationBottom].forEach((bar) => {
        if (!bar) return;
        bar.hidden = false;
        bar.innerHTML = html;
    });
}

function buildPaginationHtml(current, total) {
    const parts = [];
    parts.push(`<button class="page-btn" data-page="${current - 1}"${current === 0 ? ' disabled' : ''} aria-label="Previous page">← Prev</button>`);
    for (const n of getPageNumbers(current, total)) {
        if (n === '...') {
            parts.push('<span class="page-ellipsis">…</span>');
        } else {
            const isCur = n === current;
            parts.push(`<button class="page-btn${isCur ? ' page-btn--current' : ''}" data-page="${n}" aria-label="Page ${n + 1}"${isCur ? ' aria-current="page"' : ''}>${n + 1}</button>`);
        }
    }
    parts.push(`<button class="page-btn" data-page="${current + 1}"${current === total - 1 ? ' disabled' : ''} aria-label="Next page">Next →</button>`);
    return parts.join('');
}

function getPageNumbers(current, total) {
    if (total <= 9) return Array.from({ length: total }, (_, i) => i);
    const set = new Set([0, total - 1]);
    for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) set.add(i);
    const sorted = Array.from(set).sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
        result.push(sorted[i]);
    }
    return result;
}

function goToPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= paginationState.pages.length) return;
    // Auto-save the current page's edits before navigating
    if (editorState.active) exitEditMode(true);
    renderPage(pageIndex);
}

function setupPaginationListeners() {
    [elements.paginationTop, elements.paginationBottom].forEach((bar) => {
        if (!bar) return;
        bar.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-page]');
            if (!btn || btn.disabled) return;
            const page = parseInt(btn.dataset.page, 10);
            if (!isNaN(page)) goToPage(page);
        });
    });
}

// ─── Edit Mode ───────────────────────────────────────────────────────────────

function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        editorState.savedRange = sel.getRangeAt(0).cloneRange();
    }
}

function restoreSelection() {
    if (!editorState.savedRange) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(editorState.savedRange);
}

function enterEditMode() {
    if (editorState.active) return;
    editorState.active = true;

    // Snapshot for Cancel rollback
    editorState.snapshot = {
        html: elements.articleRoot ? elements.articleRoot.innerHTML : '',
        title: elements.readerTitle ? elements.readerTitle.textContent : '',
        byline: elements.readerByline ? elements.readerByline.textContent : ''
    };

    // styleWithCSS must come first so browser produces <span style="...">
    document.execCommand('styleWithCSS', false, true);

    // Enable contenteditable on the three editable regions
    [elements.articleRoot, elements.readerTitle, elements.readerByline].forEach((el) => {
        if (el) {
            el.setAttribute('contenteditable', 'true');
            el.classList.add('edit-active-field');
        }
    });

    if (elements.editToolbarRow) elements.editToolbarRow.style.display = 'flex';
    if (elements.editActionRow) elements.editActionRow.style.display = 'flex';
    if (elements.editToggleBtn) {
        elements.editToggleBtn.classList.add('edit-active');
        elements.editToggleBtn.textContent = 'Editing';
    }
    if (elements.downloadEpubBtn) elements.downloadEpubBtn.disabled = true;

    // Set exact sticky top values based on measured element heights
    requestAnimationFrame(() => {
        const navH = (document.querySelector('.top-nav') || {}).offsetHeight || 56;
        const toolsH = (document.querySelector('.reader-tools-row') || {}).offsetHeight || 64;
        const toolbarH = (elements.editToolbarRow || {}).offsetHeight || 40;
        if (elements.editToolbarRow) elements.editToolbarRow.style.top = `${navH + toolsH}px`;
        if (elements.editActionRow) elements.editActionRow.style.top = `${navH + toolsH + toolbarH}px`;
    });

    updateToolbarState();
    if (elements.articleRoot) elements.articleRoot.focus();
}

function exitEditMode(save) {
    if (!editorState.active) return;

    if (save) {
        const newHtml = elements.articleRoot ? elements.articleRoot.innerHTML : '';
        const newTitle = elements.readerTitle ? elements.readerTitle.textContent : '';
        const newByline = elements.readerByline ? elements.readerByline.textContent : '';

        if (paginationState.enabled) {
            // Persist current page's edits and rebuild the full article html
            paginationState.pages[paginationState.currentPage] = newHtml;
            if (readerState.currentArticle) {
                readerState.currentArticle.html = paginationState.pages.join('\n');
                readerState.currentArticle.title = newTitle;
                readerState.currentArticle.byline = newByline;
            }
        } else if (readerState.currentArticle) {
            readerState.currentArticle.html = newHtml || readerState.currentArticle.html;
            readerState.currentArticle.title = newTitle;
            readerState.currentArticle.byline = newByline;
        }
    } else {
        // Roll back to snapshot
        if (editorState.snapshot) {
            if (elements.articleRoot) elements.articleRoot.innerHTML = editorState.snapshot.html;
            if (elements.readerTitle) elements.readerTitle.textContent = editorState.snapshot.title;
            if (elements.readerByline) elements.readerByline.textContent = editorState.snapshot.byline;
        }
    }

    [elements.articleRoot, elements.readerTitle, elements.readerByline].forEach((el) => {
        if (el) {
            el.removeAttribute('contenteditable');
            el.classList.remove('edit-active-field');
        }
    });

    if (elements.editToolbarRow) { elements.editToolbarRow.style.display = 'none'; elements.editToolbarRow.style.top = ''; }
    if (elements.editActionRow) { elements.editActionRow.style.display = 'none'; elements.editActionRow.style.top = ''; }
    if (elements.editToggleBtn) {
        elements.editToggleBtn.classList.remove('edit-active');
        elements.editToggleBtn.textContent = 'Edit';
    }
    if (elements.downloadEpubBtn) elements.downloadEpubBtn.disabled = false;

    editorState.active = false;
    editorState.savedRange = null;
    editorState.snapshot = null;

    // Library articles (those originally loaded from Supabase) get their edits synced
    // back to the cloud. Other reader payloads (Convert tab, postMessage from extension,
    // local EPUB upload) have no articleId and saveArticleVersion early-returns.
    if (save && readerState.currentArticle?.articleId && authState.isLoggedIn) {
        saveArticleVersion();
    }
}

function execFormat(command, value) {
    restoreSelection();
    document.execCommand(command, false, value || null);
    updateToolbarState();
}

function applyFontSize(px) {
    restoreSelection();
    document.execCommand('fontSize', false, '7');
    // Replace browser's <font size="7"> with a proper <span style="font-size:Xpx">
    if (elements.articleRoot) {
        elements.articleRoot.querySelectorAll('font[size="7"]').forEach((fontEl) => {
            const span = document.createElement('span');
            span.style.fontSize = `${px}px`;
            span.innerHTML = fontEl.innerHTML;
            fontEl.replaceWith(span);
        });
    }
    updateToolbarState();
}

function applyFontColor(color) {
    restoreSelection();
    document.execCommand('foreColor', false, color);
    editorState.currentFontColor = color;
    if (elements.editColorBar) elements.editColorBar.style.background = color;
    updateToolbarState();
}

function applyHighlight(color) {
    restoreSelection();
    // hiliteColor is standard; backColor is the IE/legacy fallback
    const applied = document.execCommand('hiliteColor', false, color);
    if (!applied) document.execCommand('backColor', false, color);
    editorState.currentHlColor = color;
    // Mark the matching preset as selected
    if (elements.editHlPresets) {
        elements.editHlPresets.forEach((btn) => {
            btn.classList.toggle('edit-hl-selected', btn.dataset.color === color);
        });
    }
    updateToolbarState();
}

function removeHighlight() {
    applyHighlight('transparent');
}

function insertNoteBlock() {
    restoreSelection();
    document.execCommand('insertHTML', false, '<hr /><blockquote class="edit-note-block">Note...</blockquote><hr />');
    updateToolbarState();
}

function insertHorizontalRule() {
    restoreSelection();
    document.execCommand('insertHorizontalRule');
    updateToolbarState();
}

function updateToolbarState() {
    const stateCmds = ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', 'insertUnorderedList', 'insertOrderedList'];
    if (elements.editCmdButtons) {
        elements.editCmdButtons.forEach((btn) => {
            const cmd = btn.dataset.cmd;
            if (stateCmds.includes(cmd)) {
                try {
                    btn.classList.toggle('edit-btn--on', document.queryCommandState(cmd));
                } catch (e) {
                    // ignore
                }
            }
        });
    }
}


// ─── Image Modal ─────────────────────────────────────────────────────────────

function openImageModal() {
    saveSelection();
    if (elements.editImgUrlInput) elements.editImgUrlInput.value = '';
    if (elements.editImgAltUrl) elements.editImgAltUrl.value = '';
    if (elements.editImgFileInput) elements.editImgFileInput.value = '';
    if (elements.editImgAltFile) elements.editImgAltFile.value = '';
    if (elements.editImgPreview) { elements.editImgPreview.innerHTML = ''; elements.editImgPreview.hidden = true; }
    editorState.pendingImageDataUri = null;
    switchImageTab('url');
    if (elements.editImageModal) elements.editImageModal.hidden = false;
}

function closeImageModal() {
    if (elements.editImageModal) elements.editImageModal.hidden = true;
    editorState.pendingImageDataUri = null;
}

function switchImageTab(tab) {
    const isUrl = tab === 'url';
    if (elements.editImgTabUrl) {
        elements.editImgTabUrl.classList.toggle('edit-modal-tab--active', isUrl);
        elements.editImgTabUrl.setAttribute('aria-selected', String(isUrl));
    }
    if (elements.editImgTabFile) {
        elements.editImgTabFile.classList.toggle('edit-modal-tab--active', !isUrl);
        elements.editImgTabFile.setAttribute('aria-selected', String(!isUrl));
    }
    if (elements.editImgPanelUrl) elements.editImgPanelUrl.hidden = !isUrl;
    if (elements.editImgPanelFile) elements.editImgPanelFile.hidden = isUrl;
}

function handleImageFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        editorState.pendingImageDataUri = ev.target.result;
        if (elements.editImgPreview) {
            elements.editImgPreview.innerHTML = `<img src="${ev.target.result}" alt="preview" style="max-width:100%;max-height:160px;">`;
            elements.editImgPreview.hidden = false;
        }
    };
    reader.readAsDataURL(file);
}

function insertImage() {
    const isUrlTab = elements.editImgPanelUrl && !elements.editImgPanelUrl.hidden;
    let imgHtml = '';

    if (isUrlTab) {
        const src = (elements.editImgUrlInput && elements.editImgUrlInput.value.trim()) || '';
        const alt = (elements.editImgAltUrl && elements.editImgAltUrl.value.trim()) || '';
        if (!src) { closeImageModal(); return; }
        imgHtml = `<img src="${src.replace(/"/g, '&quot;')}" alt="${alt.replace(/"/g, '&quot;')}" style="max-width:100%" />`;
    } else {
        if (!editorState.pendingImageDataUri) { closeImageModal(); return; }
        const alt = (elements.editImgAltFile && elements.editImgAltFile.value.trim()) || '';
        imgHtml = `<img src="${editorState.pendingImageDataUri}" alt="${alt.replace(/"/g, '&quot;')}" style="max-width:100%" />`;
    }

    restoreSelection();
    document.execCommand('insertHTML', false, imgHtml);
    closeImageModal();
    updateToolbarState();
}

// ─── Link Modal ───────────────────────────────────────────────────────────────

function openLinkModal() {
    saveSelection();
    editorState.editingLink = null;

    // Check if cursor is inside an <a>
    const sel = window.getSelection();
    if (sel && sel.anchorNode) {
        let node = sel.anchorNode;
        while (node && node !== elements.articleRoot) {
            if (node.nodeName === 'A') {
                editorState.editingLink = node;
                break;
            }
            node = node.parentElement;
        }
    }

    if (editorState.editingLink) {
        if (elements.editLinkUrl) elements.editLinkUrl.value = editorState.editingLink.href || '';
        if (elements.editLinkText) elements.editLinkText.value = editorState.editingLink.textContent || '';
    } else {
        if (elements.editLinkUrl) elements.editLinkUrl.value = '';
        if (elements.editLinkText) elements.editLinkText.value = sel ? sel.toString() : '';
    }

    if (elements.editLinkModal) elements.editLinkModal.hidden = false;
    if (elements.editLinkUrl) elements.editLinkUrl.focus();
}

function closeLinkModal() {
    if (elements.editLinkModal) elements.editLinkModal.hidden = true;
    editorState.editingLink = null;
}

function insertLink() {
    const url = (elements.editLinkUrl && elements.editLinkUrl.value.trim()) || '';
    if (!url) { closeLinkModal(); return; }
    const text = (elements.editLinkText && elements.editLinkText.value.trim()) || url;

    if (editorState.editingLink) {
        editorState.editingLink.href = url;
        editorState.editingLink.textContent = text;
    } else {
        restoreSelection();
        const linkHtml = `<a href="${url.replace(/"/g, '&quot;')}" target="_blank" rel="noopener">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a>`;
        document.execCommand('insertHTML', false, linkHtml);
    }

    closeLinkModal();
    updateToolbarState();
}

// ─── Edit Event Wiring ────────────────────────────────────────────────────────

function setupEditEventListeners() {
    // Edit toggle
    if (elements.editToggleBtn) {
        elements.editToggleBtn.addEventListener('click', () => {
            if (editorState.active) {
                exitEditMode(false);
            } else {
                enterEditMode();
            }
        });
    }

    // Save / Cancel
    if (elements.editSaveBtn) elements.editSaveBtn.addEventListener('click', () => exitEditMode(true));
    if (elements.editCancelBtn) elements.editCancelBtn.addEventListener('click', () => exitEditMode(false));

    // data-cmd formatting buttons
    if (elements.editCmdButtons) {
        elements.editCmdButtons.forEach((btn) => {
            btn.addEventListener('mousedown', (e) => { e.preventDefault(); saveSelection(); });
            btn.addEventListener('click', () => execFormat(btn.dataset.cmd));
        });
    }

    // Font size select
    if (elements.editFontSizeSelect) {
        elements.editFontSizeSelect.addEventListener('mousedown', () => saveSelection());
        elements.editFontSizeSelect.addEventListener('change', () => {
            const px = parseInt(elements.editFontSizeSelect.value, 10);
            if (px) applyFontSize(px);
            elements.editFontSizeSelect.value = '';
        });
    }

    // Font color picker
    if (elements.editBtnFontColor) {
        elements.editBtnFontColor.addEventListener('mousedown', (e) => { e.preventDefault(); saveSelection(); });
        elements.editBtnFontColor.addEventListener('click', () => {
            if (elements.editColorPicker) elements.editColorPicker.click();
        });
    }
    if (elements.editColorPicker) {
        elements.editColorPicker.addEventListener('mousedown', () => saveSelection());
        elements.editColorPicker.addEventListener('input', () => {
            if (elements.editColorBar) elements.editColorBar.style.background = elements.editColorPicker.value;
        });
        elements.editColorPicker.addEventListener('change', () => applyFontColor(elements.editColorPicker.value));
    }

    // Inline highlight swatches — always visible, no popup
    if (elements.editHlPresets) {
        elements.editHlPresets.forEach((btn) => {
            btn.addEventListener('mousedown', (e) => { e.preventDefault(); saveSelection(); });
            btn.addEventListener('click', () => applyHighlight(btn.dataset.color));
        });
    }

    if (elements.editHlRemove) {
        elements.editHlRemove.addEventListener('mousedown', (e) => { e.preventDefault(); saveSelection(); });
        elements.editHlRemove.addEventListener('click', removeHighlight);
    }

    if (elements.editHlCustom) {
        elements.editHlCustom.addEventListener('mousedown', () => saveSelection());
        elements.editHlCustom.addEventListener('input', () => {
            if (elements.editHlCustomBar) elements.editHlCustomBar.style.background = elements.editHlCustom.value;
        });
        elements.editHlCustom.addEventListener('change', () => applyHighlight(elements.editHlCustom.value));
    }

    // HR / Note / Image / Link
    if (elements.editBtnHr) {
        elements.editBtnHr.addEventListener('mousedown', (e) => { e.preventDefault(); saveSelection(); });
        elements.editBtnHr.addEventListener('click', insertHorizontalRule);
    }
    if (elements.editBtnNote) {
        elements.editBtnNote.addEventListener('mousedown', (e) => { e.preventDefault(); saveSelection(); });
        elements.editBtnNote.addEventListener('click', insertNoteBlock);
    }
    if (elements.editBtnImage) {
        elements.editBtnImage.addEventListener('mousedown', (e) => { e.preventDefault(); saveSelection(); });
        elements.editBtnImage.addEventListener('click', openImageModal);
    }
    if (elements.editBtnLink) {
        elements.editBtnLink.addEventListener('mousedown', (e) => { e.preventDefault(); saveSelection(); });
        elements.editBtnLink.addEventListener('click', openLinkModal);
    }

    // Image modal internals
    if (elements.editImgTabUrl) {
        elements.editImgTabUrl.addEventListener('click', () => switchImageTab('url'));
    }
    if (elements.editImgTabFile) {
        elements.editImgTabFile.addEventListener('click', () => switchImageTab('file'));
    }
    if (elements.editImgFileInput) {
        elements.editImgFileInput.addEventListener('change', handleImageFileSelect);
    }
    if (elements.editImgInsertBtn) elements.editImgInsertBtn.addEventListener('click', insertImage);
    if (elements.editImgCancelBtn) elements.editImgCancelBtn.addEventListener('click', closeImageModal);
    // Click on backdrop closes modal
    if (elements.editImageModal) {
        elements.editImageModal.addEventListener('click', (e) => {
            if (e.target === elements.editImageModal) closeImageModal();
        });
    }

    // Link modal internals
    if (elements.editLinkInsertBtn) elements.editLinkInsertBtn.addEventListener('click', insertLink);
    if (elements.editLinkCancelBtn) elements.editLinkCancelBtn.addEventListener('click', closeLinkModal);
    if (elements.editLinkModal) {
        elements.editLinkModal.addEventListener('click', (e) => {
            if (e.target === elements.editLinkModal) closeLinkModal();
        });
    }

    // selectionchange → update toolbar active states
    document.addEventListener('selectionchange', () => {
        if (!editorState.active) return;
        const sel = window.getSelection();
        if (sel && sel.anchorNode && elements.articleRoot && elements.articleRoot.contains(sel.anchorNode)) {
            updateToolbarState();
        }
    });

    // Keyboard shortcuts inside article: Ctrl/Cmd+S = save, Escape = cancel
    if (elements.articleRoot) {
        elements.articleRoot.addEventListener('keydown', (e) => {
            if (!editorState.active) return;
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                exitEditMode(true);
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                exitEditMode(false);
            }
        });
    }
}
