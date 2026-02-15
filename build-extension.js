const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Production configuration
const PRODUCTION_API_BASE = 'https://cyberspace-backend.onrender.com/api/v1/scan';

console.log('🔧 Building extension for production...');

// Create production directory
const prodDir = path.join(__dirname, 'extension-prod');
if (fs.existsSync(prodDir)) {
  fs.rmSync(prodDir, { recursive: true });
}
fs.mkdirSync(prodDir);

// Copy extension files
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir('extension', prodDir);

// Update background.js with production API
const backgroundPath = path.join(prodDir, 'background.js');
let backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
backgroundContent = backgroundContent.replace(
  /const defaultApiBase = "http:\/\/localhost:3000\/api\/v1\/scan";/g,
  `const defaultApiBase = "${PRODUCTION_API_BASE}";`
);
fs.writeFileSync(backgroundPath, backgroundContent);

// Update options.js with production API
const optionsPath = path.join(prodDir, 'options.js');
let optionsContent = fs.readFileSync(optionsPath, 'utf8');
optionsContent = optionsContent.replace(
  /const defaultApiBase = "http:\/\/localhost:3000\/api\/v1\/scan";/g,
  `const defaultApiBase = "${PRODUCTION_API_BASE}";`
);
fs.writeFileSync(optionsPath, optionsContent);

// Update manifest.json version for production
const manifestPath = path.join(prodDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.version = '1.0.1'; // Increment version for production
manifest.description = 'Quickly check if the current website (or any URL) is safe using the CyberSpace API. Production version.';
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('✅ Extension built for production in extension-prod/');
console.log('📦 To create .crx file, load the extension-prod/ folder in Chrome and pack it');
console.log('🌐 Production API endpoint:', PRODUCTION_API_BASE);
