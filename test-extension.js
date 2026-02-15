// Simple test script to verify the API endpoints
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api/v1/scan';

async function testGetEndpoint() {
  console.log('Testing GET endpoint...');
  try {
    const url = 'https://example.com';
    const endpoint = `${API_BASE}/check?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(endpoint);
    const data = await response.json();
    
    console.log('✅ GET endpoint working:');
    console.log(JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ GET endpoint failed:', error.message);
    return false;
  }
}

async function testPostEndpoint() {
  console.log('\nTesting POST endpoint...');
  try {
    const url = 'https://example.com';
    const endpoint = `${API_BASE}/url`;
    
    const requestBody = {
      url: url,
      includeContent: false,
      includeScreenshot: false,
      includeThreatIntel: true
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    console.log('✅ POST endpoint working:');
    console.log(JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ POST endpoint failed:', error.message);
    return false;
  }
}

async function testHealthEndpoint() {
  console.log('\nTesting health endpoint...');
  try {
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    
    console.log('✅ Health endpoint working:');
    console.log(JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing CyberSpace API endpoints...\n');
  
  const healthOk = await testHealthEndpoint();
  const getOk = await testGetEndpoint();
  const postOk = await testPostEndpoint();
  
  console.log('\n📊 Test Results:');
  console.log(`Health: ${healthOk ? '✅' : '❌'}`);
  console.log(`GET: ${getOk ? '✅' : '❌'}`);
  console.log(`POST: ${postOk ? '✅' : '❌'}`);
  
  if (healthOk && getOk && postOk) {
    console.log('\n🎉 All tests passed! Your API is ready for the extension.');
    console.log('\nNext steps:');
    console.log('1. Load the extension in Chrome (chrome://extensions/)');
    console.log('2. Enable Developer mode');
    console.log('3. Click "Load unpacked" and select the extension/ folder');
    console.log('4. Test the extension on any website!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check your backend server.');
  }
}

runTests().catch(console.error);
