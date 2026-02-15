// Test script to verify the URL scanner is working correctly
const { scanUrlComprehensive } = require('./backend/services/urlScanner');

async function testScanner() {
  console.log('🧪 Testing CyberSpace URL Scanner...\n');

  const testUrls = [
    // Should be safe
    'https://google.com',
    'https://facebook.com',
    'https://github.com',
    
    // Should be suspicious/unsafe
    'http://example.com', // HTTP
    'https://suspicious-site.xyz',
    'https://phishing-site.click',
    'https://malicious-site.gq',
    'https://test123456789.site',
    'https://bank-login-secure.verify.com',
    'https://paypal-secure-login.xyz',
    'https://free-gift-bonus-claim.site',
    'https://192.168.1.1', // IP address
    'https://xn--example.com', // Punycode
    'https://very-long-domain-name-that-looks-suspicious-and-might-be-phishing.xyz'
  ];

  for (const url of testUrls) {
    try {
      console.log(`\n🔍 Testing: ${url}`);
      const result = await scanUrlComprehensive(url, {
        includeContent: false,
        includeScreenshot: false,
        includeThreatIntel: true
      });
      
      console.log(`   Risk Level: ${result.riskLevel}`);
      console.log(`   Risk Score: ${result.riskScore}`);
      console.log(`   Safe: ${result.safe}`);
      console.log(`   Threats: ${result.threats.length}`);
      console.log(`   Warnings: ${result.warnings.length}`);
      
      if (result.threats.length > 0) {
        console.log(`   Threats: ${result.threats.map(t => t.type).join(', ')}`);
      }
      if (result.warnings.length > 0) {
        console.log(`   Warnings: ${result.warnings.map(w => w.type).join(', ')}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log('✅ The scanner should now be more strict and not mark everything as safe');
  console.log('✅ HTTP URLs should be flagged as unsafe');
  console.log('✅ Suspicious TLDs should trigger warnings');
  console.log('✅ Phishing patterns should be detected');
  console.log('✅ IP addresses should be flagged');
  console.log('✅ Punycode domains should be flagged');
}

testScanner().catch(console.error);
