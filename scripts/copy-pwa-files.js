#!/usr/bin/env node

/**
 * Post-build script: Copy PWA files to .next/static for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const staticDir = path.join(process.cwd(), '.next/static');

const pwaFiles = [
  'sw.js',
  'sw-enhanced.js',
  'firebase-messaging-sw.js',
  'manifest.json',
  'browserconfig.xml',
];

console.log('📦 Copying PWA files to .next/static...');

pwaFiles.forEach(file => {
  const source = path.join(publicDir, file);
  const dest = path.join(staticDir, file);
  
  if (fs.existsSync(source)) {
    try {
      fs.copyFileSync(source, dest);
      console.log(`✅ Copied ${file}`);
    } catch (error) {
      console.error(`❌ Failed to copy ${file}:`, error.message);
    }
  } else {
    console.warn(`⚠️  ${file} not found in public folder`);
  }
});

// Copy workbox and fallback files (pattern matching)
const publicFiles = fs.readdirSync(publicDir);
const workboxFiles = publicFiles.filter(f => f.match(/^workbox-[a-f0-9]+\.js$/));
const fallbackFiles = publicFiles.filter(f => f.match(/^fallback-[A-Za-z0-9_-]+\.js$/));

[...workboxFiles, ...fallbackFiles].forEach(file => {
  const source = path.join(publicDir, file);
  const dest = path.join(staticDir, file);
  
  try {
    fs.copyFileSync(source, dest);
    console.log(`✅ Copied ${file}`);
  } catch (error) {
    console.error(`❌ Failed to copy ${file}:`, error.message);
  }
});

console.log('✨ PWA files copy completed!');
