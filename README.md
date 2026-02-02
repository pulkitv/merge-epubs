# EPUB Combiner UI

A modern, user-friendly web interface for combining multiple EPUB files into one seamlessly.

**Live Demo:** https://merge-epubs.vercel.app  
**API:** https://epub-combiner-api.onrender.com

## 📋 Project Status

- ✅ **Frontend**: Deployed on Vercel (https://merge-epubs.vercel.app)
- ✅ **Backend API**: Deployed on Render (https://epub-combiner-api.onrender.com)
- ✅ **CORS**: Configured - UI calls API directly
- ✅ **Production Ready**: All features working

## ✨ Features

### Core Functionality
- 📤 **Drag & Drop Upload** - Intuitive file upload with drag-and-drop support
- 📊 **Real-time Validation** - Validates file count (2-10), size (max 50MB each), and type
- ⚙️ **API Configuration** - Change API URL and test connection on-the-fly
- ⏳ **Progress Tracking** - Visual progress bar with status updates during combining
- 💾 **Auto-Download** - Combined EPUB automatically downloads to your device
- 🔄 **Reset Functionality** - Easily combine more files after completion
- ⚠️ **Error Handling** - Clear error messages with troubleshooting guidance

### User Experience
- 🎨 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🌙 **Modern UI** - Clean, minimalist interface with smooth animations
- ♿ **Accessible** - Keyboard navigation and screen reader friendly
- 🚀 **Fast** - Optimized for performance with minimal loading times

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Active EPUB Combiner API running

### Installation

**Option 1: Use Live Version**
Simply visit: https://merge-epubs.vercel.app

**Option 2: Run Locally**

1. Clone the repository:
```bash
git clone https://github.com/pulkitv/merge-epubs.git
cd merge-epubs
```

2. Serve the files locally:
```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx http-server -p 8080
```

3. Open http://localhost:8080 in your browser

## 📖 How to Use

1. **Configure API** (Optional)
   - Default API: `https://epub-combiner-api.onrender.com`
   - Change URL if using different API endpoint
   - Click "Test Connection" to verify

2. **Upload EPUB Files**
   - Click upload area or drag & drop files
   - Add 2-10 EPUB files (max 50MB each, 100MB total)
   - View uploaded files with their sizes

3. **Combine**
   - Click "Combine EPUBs" button
   - Monitor progress with visual indicator
   - Wait for processing to complete

4. **Download**
   - Combined EPUB automatically downloads
   - File saved as `combined.epub`
   - Option to combine more files

## 📁 Project Structure

```
merge-epubs/
├── index.html           # Main HTML structure
├── styles.css           # Styling and responsive design
├── script.js            # Application logic and API integration
├── README.md            # This file
├── ARCHITECTURE.md      # Technical documentation
├── INTEGRATION-combine-epub.md  # API integration guide
└── api/                 # (Removed - using direct Render API)
    ├── config.js        # Config proxy endpoint (DEPRECATED)
    └── combine-epubs.js # Combine proxy endpoint (DEPRECATED)
```

## 🔧 Configuration

### API Endpoints

**Connection Test:**
```
GET https://epub-combiner-api.onrender.com/config
```

**Combine EPUBs:**
```
POST https://epub-combiner-api.onrender.com/combine-epubs
Content-Type: multipart/form-data
Body: epubs (multiple files)
```

### Upload Limits

| Setting | Value |
|---------|-------|
| Max Files | 10 |
| Max File Size | 50MB per file |
| Total Upload | 100MB limit |
| Processing Timeout | 5 minutes |

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Hosting**: Vercel (Static hosting)
- **API**: Express.js/Node.js on Render
- **File Format**: EPUB (zip-based)

## 📊 Performance Metrics

- Initial Load: ~1-2 seconds
- File Upload: ~5-30 seconds (depends on file size)
- Processing: ~10-30 seconds for 2-5 files
- Download: Automatic on completion

## 🔐 Security & Privacy

- ✅ No files stored on servers
- ✅ Direct file processing
- ✅ Files deleted after combining
- ✅ HTTPS encryption for all transfers
- ✅ No data collection or analytics

## 🐛 Troubleshooting

### Connection Failed
- Verify API URL is correct
- Check internet connection
- Ensure API server is running

### Upload Fails
- Check file size (max 50MB each)
- Verify total doesn't exceed 100MB
- Ensure files have `.epub` extension
- Try uploading fewer files

### Large File Limits
- Current setup supports up to 50MB per file
- For larger files, upgrade API server plan or implement streaming

## 📈 Future Improvements

- [ ] Drag-to-reorder files
- [ ] Merge progress per file
- [ ] Support for batch operations
- [ ] Custom metadata editing
- [ ] Queue system for large batches
- [ ] Streaming for files >100MB
- [ ] Database for history/stats

## 📅 Project Timeline

**17 Jan 2026 - Initial Development**
- Created UI with HTML/CSS/JavaScript
- Implemented drag-drop upload functionality
- Added file validation and progress tracking
- Created responsive design

**18 Jan 2026 - Deployment Setup**
- Deployed UI to Vercel
- Deployed API to Render
- Fixed CORS issues
- Tested direct API integration

**2 Feb 2026 - Production Ready**
- Removed Vercel proxy layer
- Optimized for direct Render API calls
- Added upload limit messaging
- Final testing and optimization

## 📝 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

## 📞 Support & Contribution

For issues or contributions, please visit: https://github.com/pulkitv/merge-epubs

## 📄 Related Documentation

- [Architecture & Technical Details](ARCHITECTURE.md) - Deep dive into code structure
- [API Integration Guide](INTEGRATION-combine-epub.md) - Backend API reference

## 📜 License

Open source - feel free to use, modify, and distribute.

---

**Made with ❤️ for book lovers**  
Last Updated: 2 February 2026
