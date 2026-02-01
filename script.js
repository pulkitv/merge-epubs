// State management
const state = {
    files: [],
    apiUrl: '',
    apiConfig: null,
    combinedBlob: null
};

// DOM elements
const elements = {
    apiUrlInput: document.getElementById('apiUrl'),
    testConnectionBtn: document.getElementById('testConnection'),
    connectionStatus: document.getElementById('connectionStatus'),
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
    retryBtn: document.getElementById('retryBtn')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const defaultApiBase = `${window.location.origin}/api`;
    state.apiUrl = defaultApiBase;
    elements.apiUrlInput.value = defaultApiBase;
    setupEventListeners();
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
        elements.connectionStatus.textContent = `✓ Connected! Max files: ${state.apiConfig.maxFiles}, Max size: ${state.apiConfig.maxFileSizeMB}MB per file`;
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
