# CyberSpace Browser Extension

A Chrome extension that checks website safety using your local CyberSpace API.

## Setup Instructions

### 1. Start the Backend Server

First, make sure your backend server is running:

```bash
cd backend
npm install
npm start
```

The server should start on `http://localhost:3000`

### 2. Test the API

Run the test script to verify your API is working:

```bash
node test-extension.js
```

### 3. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension/` folder from this project
5. The extension should now appear in your extensions list

### 4. Test the Extension

1. Click the CyberSpace extension icon in your browser toolbar
2. The extension will automatically check the current website
3. You can also manually enter any URL to check
4. Click the extension options to test API connectivity

## API Endpoints

The extension uses two endpoints:

- **GET** `/api/v1/scan/check?url=<url>` - Simple URL check
- **POST** `/api/v1/scan/url` - Comprehensive scan with options

## Troubleshooting

### Extension not working?

1. Check that your backend server is running on `http://localhost:3000`
2. Open the extension options and click "Test API"
3. Check the browser console for error messages
4. Make sure CORS is properly configured in your backend

### API errors?

1. Run `node test-extension.js` to test the API directly
2. Check that all dependencies are installed: `npm install`
3. Verify the server is running and accessible

### CORS issues?

The backend is configured to allow Chrome extensions. If you're still having issues, check the CORS configuration in `backend/server.js`.

## Features

- ✅ Real-time website safety checking
- ✅ Automatic scanning of current tab
- ✅ Manual URL input
- ✅ Risk level indicators (Safe/Suspicious/Unsafe)
- ✅ Detailed threat and warning information
- ✅ Badge indicators on extension icon
- ✅ API connectivity testing

## Configuration

You can change the API endpoint in the extension options:
1. Right-click the extension icon
2. Select "Options"
3. Update the API base URL if needed
4. Test the connection

The default API endpoint is `http://localhost:3000/api/v1/scan`
