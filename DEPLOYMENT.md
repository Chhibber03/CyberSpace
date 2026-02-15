# CyberSpace Deployment Guide

## Overview
This guide explains how to deploy the complete CyberSpace application (backend, frontend, and extension) to Render.

## Architecture
- **Backend:** Node.js API service on Render
- **Frontend:** Static site built with Vite on Render
- **Extension:** Browser extension with production API endpoints

## Prerequisites
- Render account
- Git repository with your code
- Node.js for local testing

## Step 1: Prepare Your Repository

### 1.1 Verify File Structure
Ensure your repository has this structure:
```
/
├── render.yaml              # Main deployment config
├── package.json             # Frontend dependencies
├── vite.config.js           # Vite configuration
├── config.js               # Frontend config
├── app.js                  # Frontend app
├── index.html              # Frontend HTML
├── styles.css              # Frontend styles
├── build-extension.js      # Extension build script
├── backend/
│   ├── package.json        # Backend dependencies
│   ├── server.js           # Backend server
│   ├── routes/             # API routes
│   └── services/           # Business logic
└── extension/
    ├── manifest.json       # Extension manifest
    ├── background.js       # Extension background
    ├── popup.html          # Extension popup
    └── options.js          # Extension options
```

### 1.2 Environment Variables
The following environment variables are automatically set by Render:
- `VITE_BACKEND_URL`: Backend API URL
- `VITE_EXTENSION_DOWNLOAD_URL`: Extension download URL
- `NODE_ENV`: Production environment
- `PORT`: Backend port (10000)
- `CORS_ORIGIN`: Frontend URL for CORS

## Step 2: Deploy to Render

### 2.1 Connect Repository
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your Git repository
4. Render will automatically detect the `render.yaml` file

### 2.2 Automatic Deployment
Render will automatically:
1. Deploy the backend service (`cyberspace-backend`)
2. Deploy the frontend service (`cyberspace-frontend`)
3. Set up environment variables
4. Configure CORS between services

### 2.3 Manual Deployment (Alternative)
If you prefer manual deployment:

#### Backend Service
1. Create new "Web Service"
2. Connect your repository
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables

#### Frontend Service
1. Create new "Static Site"
2. Connect your repository
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add environment variables

## Step 3: Build and Deploy Extension

### 3.1 Build Production Extension
```bash
# Run the build script
npm run build:extension
```

This creates a `extension-prod/` folder with:
- Production API endpoints configured
- Updated manifest version
- Ready for Chrome Web Store

### 3.2 Deploy Extension
Choose one of these options:

#### Option A: Chrome Web Store (Recommended)
1. Create developer account at [Chrome Web Store](https://chrome.google.com/webstore/devconsole/)
2. Upload `extension-prod/` folder as ZIP
3. Fill in store listing details
4. Submit for review
5. Update `VITE_EXTENSION_DOWNLOAD_URL` to store URL

#### Option B: Direct Download
1. Package extension as `.crx` file
2. Upload to frontend's public directory
3. Update `VITE_EXTENSION_DOWNLOAD_URL` to file path

## Step 4: Verify Deployment

### 4.1 Check Backend
- Visit: `https://cyberspace-backend.onrender.com/health`
- Should return: `{"status":"healthy","timestamp":"...","version":"1.0.0"}`

### 4.2 Check Frontend
- Visit: `https://cyberspace-frontend.onrender.com`
- Should load the main application
- Check browser console for any errors

### 4.3 Test API Integration
1. Open frontend in browser
2. Try scanning a URL
3. Check that it connects to backend
4. Verify results are displayed

### 4.4 Test Extension
1. Install the production extension
2. Visit various websites
3. Check badge indicators
4. Verify API calls work

## Step 5: Monitor and Maintain

### 5.1 Monitor Services
- Check Render dashboard for service status
- Monitor logs for errors
- Set up alerts for downtime

### 5.2 Update Extension
1. Make changes to extension code
2. Run `npm run build:extension`
3. Update Chrome Web Store listing
4. Users will get automatic updates

### 5.3 Scale Services
- Upgrade Render plan for more resources
- Add caching layers if needed
- Monitor API usage and rate limits

## Troubleshooting

### Common Issues

#### Backend Not Starting
1. Check `backend/package.json` has correct start script
2. Verify all dependencies are installed
3. Check Render logs for errors
4. Ensure `PORT` environment variable is set

#### Frontend Build Failing
1. Check `package.json` has correct build script
2. Verify Vite configuration
3. Check for missing dependencies
4. Ensure environment variables are set

#### CORS Errors
1. Verify `CORS_ORIGIN` is set correctly
2. Check backend CORS configuration
3. Ensure frontend URL is in allowed origins
4. Test API endpoints directly

#### Extension Not Working
1. Check extension options for API endpoint
2. Verify backend is accessible
3. Check browser console for errors
4. Ensure extension has correct permissions

### Debug Commands
```bash
# Test backend locally
cd backend && npm start

# Test frontend locally
npm run dev

# Build extension
npm run build:extension

# Check environment variables
echo $VITE_BACKEND_URL
```

## Security Considerations

### Backend Security
- Rate limiting is enabled
- CORS is properly configured
- Helmet.js provides security headers
- Input validation on all endpoints

### Frontend Security
- Environment variables are properly handled
- No sensitive data in client code
- HTTPS enforced in production

### Extension Security
- Minimal permissions requested
- API calls are rate-limited
- No sensitive data stored locally
- HTTPS communication only

## Cost Optimization

### Render Free Tier
- Backend: 750 hours/month
- Frontend: Unlimited
- Auto-sleep after 15 minutes of inactivity

### Scaling Options
- Upgrade to paid plans for more resources
- Add caching to reduce API calls
- Optimize extension for efficiency

## Support

For deployment issues:
1. Check Render documentation
2. Review service logs
3. Test locally first
4. Contact Render support if needed

For application issues:
1. Check browser console
2. Verify API endpoints
3. Test with different browsers
4. Review extension permissions
