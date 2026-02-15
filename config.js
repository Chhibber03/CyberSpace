// Configuration for CyberSpace frontend
// This file is processed by Vite to inject environment variables

export const config = {
  // Backend API URL - will be replaced by Vite with environment variable
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  
  // Extension download URL - will be replaced by Vite with environment variable
  EXTENSION_DOWNLOAD_URL: import.meta.env.VITE_EXTENSION_DOWNLOAD_URL || '/extension.crx',
  
  // Environment
  ENV: import.meta.env.MODE || 'development',
  
  // Feature flags
  FEATURES: {
    DEMO_FALLBACK: true,
    EXTENSION_DOWNLOAD: true,
    REAL_TIME_SCANNING: true
  }
};
