#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Extension files to include
const extensionFiles = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'background.js',
  'content.js',
  'options.html',
  'options.js',
  'styles.css'
];

// Create output directory if it doesn't exist
const outputDir = 'dist';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(outputDir, 'cyberspace-extension.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log('🎉 Extension package created successfully!');
  console.log(`📦 Total size: ${(archive.pointer() / 1024).toFixed(2)} KB`);
  console.log('\n📋 Installation Instructions:');
  console.log('1. Extract the zip file to a folder');
  console.log('2. Open Chrome and go to chrome://extensions/');
  console.log('3. Enable "Developer mode" (toggle in top right)');
  console.log('4. Click "Load unpacked" and select the extracted folder');
  console.log('5. ✅ API base URL is pre-configured for production');
  console.log('6. ✅ No configuration needed - ready to use!');
});

// Good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('⚠️  Warning:', err.message);
  } else {
    throw err;
  }
});

// Good practice to catch this error explicitly
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add extension files to the archive
extensionFiles.forEach(file => {
  const filePath = path.join('extension', file);
  if (fs.existsSync(filePath)) {
    archive.file(filePath, { name: file });
    console.log(`✅ Added: ${file}`);
  } else {
    console.warn(`⚠️  File not found: ${filePath}`);
  }
});

// Finalize the archive (ie we are done appending files but streams have to finish)
archive.finalize();
