# CyberSpace Extension Deployment Guide

## Overview
This guide explains how to deploy the CyberSpace browser extension for production use with the Render-hosted backend.

## Prerequisites
- Node.js installed
- Chrome browser for extension packaging
- Access to Render dashboard

## Step 1: Build Production Extension

1. **Build the extension for production:**
   ```bash
   npm run build:extension
   ```

2. **This creates a `extension-prod/` folder with:**
   - Production API endpoints configured
   - Updated manifest version
   - All extension files ready for packaging

## Step 2: Package Extension for Chrome Web Store

### Option A: Load Unpacked (Development)
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `extension-prod/` folder
4. The extension is now installed and ready to use

### Option B: Create .crx File (Distribution)
1. In `chrome://extensions/`, click "Pack extension"
2. Select the `extension-prod/` folder
3. Choose a private key file (or create new)
4. Click "Pack Extension"
5. This creates a `.crx` file and `.pem` key file

### Option C: Chrome Web Store (Public Distribution)
1. Create a developer account at [Chrome Web Store](https://chrome.google.com/webstore/devconsole/)
2. Upload the `extension-prod/` folder as a ZIP
3. Fill in store listing details
4. Submit for review

## Step 3: Update Frontend Download Link

1. **If using .crx file:**
   - Upload the `.crx` file to your frontend's public directory
   - Update `VITE_EXTENSION_DOWNLOAD_URL` in Render environment variables

2. **If using Chrome Web Store:**
   - Update `VITE_EXTENSION_DOWNLOAD_URL` to the Chrome Web Store URL

## Step 4: Verify Production Setup

1. **Test the extension:**
   - Install the production extension
   - Visit various websites
   - Check that the badge shows correct status
   - Verify API calls go to production backend

2. **Check extension options:**
   - Right-click extension icon → Options
   - Verify API endpoint shows production URL
   - Test API connection

## Configuration Details

### Production API Endpoint
- **URL:** `https://cyberspace-backend.onrender.com/api/v1/scan`
- **Features:** Real-time URL scanning, threat detection, safety scoring

### Extension Features
- ✅ Real-time website safety checking
- ✅ Automatic threat detection
- ✅ Badge indicators for safety status
- ✅ Seamless integration with production backend
- ✅ No configuration needed - ready to use!

### Environment Variables
The extension automatically uses the production backend URL:
- `https://cyberspace-backend.onrender.com/api/v1/scan`

## Troubleshooting

### Extension Not Working
1. Check browser console for errors
2. Verify API endpoint in extension options
3. Ensure backend is running on Render
4. Check CORS configuration in backend

### API Connection Issues
1. Verify backend URL is correct
2. Check Render service status
3. Ensure CORS allows extension origin
4. Test API endpoint directly

### Badge Not Showing
1. Check extension permissions
2. Verify content script is loading
3. Check background script console
4. Ensure API responses are valid

## Security Notes

- The extension only requests necessary permissions
- API calls are rate-limited
- All communication uses HTTPS
- No sensitive data is stored locally
- Extension can be easily updated via Chrome Web Store

## Support

For issues with the extension:
1. Check the browser console for errors
2. Verify the backend is running
3. Test API endpoints directly
4. Check Render service logs
