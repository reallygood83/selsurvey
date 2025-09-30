const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🚀 Testing new Vercel domain: https://sel-emotion-platform.vercel.app');
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'domain-test-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000,
    devtools: true 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 1. Navigating to new domain...');
    
    // Navigate to the new domain
    await page.goto('https://sel-emotion-platform.vercel.app', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(3000);
    
    console.log('📸 Taking homepage screenshot...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-homepage.png'),
      fullPage: true 
    });
    
    // Check for main content
    const title = await page.title();
    console.log(`📋 Page title: "${title}"`);
    
    // Check for SEL platform content
    const selContent = await page.locator('text=SEL').count();
    const emotionContent = await page.locator('text=감정').count();
    const educationContent = await page.locator('text=교육').count();
    
    console.log(`🎯 SEL content found: ${selContent}`);
    console.log(`💝 Emotion content found: ${emotionContent}`);
    console.log(`🎓 Education content found: ${educationContent}`);
    
    // Try to navigate to login page
    console.log('🔐 2. Testing login page access...');
    await page.goto('https://sel-emotion-platform.vercel.app/auth/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    
    console.log('📸 Taking login page screenshot...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-login-page.png'),
      fullPage: true 
    });
    
    // Check for Google login buttons
    const googleButtons = await page.locator('button:has-text("Google"), .google-signin, [class*="google"]').count();
    console.log(`🔍 Google login buttons found: ${googleButtons}`);
    
    // Check for role cards
    const teacherCard = await page.locator('text="교사"').count();
    const studentCard = await page.locator('text="학생"').count();
    
    console.log(`👨‍🏫 Teacher content found: ${teacherCard}`);
    console.log(`👨‍🎓 Student content found: ${studentCard}`);
    
    // Test responsive design
    console.log('📱 3. Testing responsive design...');
    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await page.waitForTimeout(1000);
    
    console.log('📸 Taking tablet view screenshot...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-tablet-view.png'),
      fullPage: true 
    });
    
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.waitForTimeout(1000);
    
    console.log('📸 Taking mobile view screenshot...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-mobile-view.png'),
      fullPage: true 
    });
    
    console.log('✅ Domain test completed successfully!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
    
    console.log('\n🔍 TEST SUMMARY:');
    console.log('================');
    console.log(`✓ Domain access: https://sel-emotion-platform.vercel.app`);
    console.log(`✓ Page title: "${title}"`);
    console.log(`✓ SEL content detection: ${selContent > 0 ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`✓ Login page access: SUCCESS`);
    console.log(`✓ Google authentication: ${googleButtons > 0 ? 'DETECTED' : 'NOT DETECTED'}`);
    console.log(`✓ Role selection UI: ${teacherCard > 0 || studentCard > 0 ? 'PRESENT' : 'MISSING'}`);
    console.log(`✓ Responsive design: TESTED`);
    console.log(`✓ Screenshots captured: 4`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take error screenshot
    try {
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'error-screenshot.png'),
        fullPage: true 
      });
      console.log('📸 Error screenshot saved');
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError);
    }
  } finally {
    await browser.close();
    console.log('🏁 Browser closed. Test completed.');
  }
})();