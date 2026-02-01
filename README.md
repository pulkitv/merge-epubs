# EPUB Combiner UI

A modern, user-friendly web interface for combining multiple EPUB files into one.

## Features

✨ **Easy to Use**
- Drag & drop or click to upload EPUB files
- Support for up to 10 files at once (max 50MB each)
- Real-time file validation
- Beautiful, responsive design

🔧 **Configurable**
- Change API URL on the fly
- Test connection before uploading
- Automatic API configuration detection

📊 **Progress Tracking**
- Visual progress bar during combination
- Clear status messages
- Error handling with helpful messages

💾 **Download Management**
- Automatic download of combined EPUB
- Option to combine more files after completion

## Getting Started

### Prerequisites

Make sure your EPUB Combiner API is running. By default, it should be available at:
```
http://localhost:3000
```

### Installation

1. No installation needed! This is a static HTML application.

2. Simply open `index.html` in your web browser:
   - Double-click the file, or
   - Right-click and select "Open with" → Your browser
   - Or serve it with a local web server (see below)

### Using a Local Web Server (Optional)

For better CORS handling and development experience, you can serve the files:

**Using Python:**
```bash
# Python 3
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

**Using Node.js (with npx):**
```bash
npx http-server -p 8080
```

**Using PHP:**
```bash
php -S localhost:8080
```

Then open: `http://localhost:8080`

## How to Use

1. **Configure API URL** (if different from default)
   - Enter your API URL in the configuration section
   - Click "Test Connection" to verify

2. **Upload EPUB Files**
   - Click the upload area or drag & drop EPUB files
   - Add between 2 to 10 files
   - Each file must be under 50MB

3. **Review Your Files**
   - See all uploaded files with their sizes
   - Remove any files you don't want to include

4. **Combine**
   - Click "Combine EPUBs" button
   - Wait for the processing to complete
   - Download the combined EPUB file

5. **Start Over** (Optional)
   - Click "Combine More Files" to reset and start again

## File Structure

```
ui-combine-epub/
├── index.html          # Main HTML file
├── styles.css          # Styling and design
├── script.js           # Application logic
├── README.md           # This file
└── INTEGRATION-combine-epub.md  # API documentation
```

## Browser Compatibility

Works on all modern browsers:
- ✅ Chrome/Edge (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14+)
- ✅ Opera (v76+)

## Troubleshooting

### Connection Failed Error

**Problem:** "Connection failed" when testing API connection

**Solutions:**
1. Ensure the EPUB Combiner API is running
2. Check if the API URL is correct
3. Verify there are no firewall/network issues
4. If running locally, make sure both API and UI are on the same domain or CORS is configured

### CORS Issues

**Problem:** Browser blocks API requests due to CORS policy

**Solutions:**
1. Ensure your API has CORS enabled for your UI domain
2. Run the UI and API on the same origin
3. Use a local web server instead of opening the HTML file directly

### Files Not Uploading

**Problem:** Files don't appear in the list after selection

**Solutions:**
1. Check file size (must be under 50MB each)
2. Ensure files have `.epub` extension
3. Verify you haven't exceeded 10 files limit
4. Try refreshing the page and uploading again

## API Configuration

The UI automatically fetches API configuration from `/config` endpoint:

```json
{
  "maxFiles": 10,
  "maxFileSize": 52428800,
  "maxFileSizeMB": 50,
  "port": 3000
}
```

## Development

### Making Changes

1. **HTML (index.html):** Modify structure and content
2. **CSS (styles.css):** Customize styling and colors
3. **JavaScript (script.js):** Change functionality and behavior

### Customizing Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #4f46e5;     /* Main brand color */
    --success-color: #10b981;      /* Success messages */
    --error-color: #ef4444;        /* Error messages */
    /* ... more variables ... */
}
```

### Adding Features

The code is well-organized and commented. Key areas:

- **State Management:** See `state` object in script.js
- **API Integration:** See `combineEpubs()` function
- **UI Updates:** See update functions like `updateFileList()`

## Security Notes

- ⚠️ Files are sent directly to the API - never stored locally
- 🔒 No sensitive data is transmitted except the EPUB files
- ✅ File type validation prevents non-EPUB uploads
- ✅ File size validation prevents oversized uploads

## License

This project is open source and available for personal and commercial use.

## Support

For API-related issues, refer to [INTEGRATION-combine-epub.md](INTEGRATION-combine-epub.md)

For UI issues, check the browser console for error messages.

---

Made with ❤️ for book lovers
