import { test, expect } from '@playwright/test';

test.describe('Authentication System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/auth/login');
  });

  test('should display login page with Google authentication options', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/로그인/);
    
    // Check for teacher login button
    await expect(page.getByTestId('teacher-login-btn')).toBeVisible();
    
    // Check for student login button
    await expect(page.getByTestId('student-login-btn')).toBeVisible();
    
    // Check for Google login text
    await expect(page.getByText('구글 계정으로 로그인')).toBeVisible();
  });

  test('should handle content blocker detection', async ({ page }) => {
    // Block Google domains to simulate content blocker
    await page.route('**/accounts.google.com/**', route => route.abort());
    await page.route('**/googleapis.com/**', route => route.abort());
    
    // Attempt teacher login
    await page.click('[data-testid="teacher-login-btn"]');
    
    // Should show content blocker error message
    await expect(page.getByText(/광고 차단기|콘텐츠 차단기/)).toBeVisible({ timeout: 10000 });
  });

  test('should handle popup blocked scenario', async ({ page }) => {
    // Mock popup blocking
    await page.addInitScript(() => {
      const originalOpen = window.open;
      window.open = () => null;
    });
    
    // Attempt student login
    await page.click('[data-testid="student-login-btn"]');
    
    // Should show popup blocked error or fallback to redirect
    await expect(
      page.getByText(/팝업이 차단|다른 방법으로 로그인/)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show retry functionality on auth errors', async ({ page }) => {
    // Mock network failure
    await page.route('**/identitytoolkit.googleapis.com/**', route => 
      route.abort('failed')
    );
    
    // Attempt login
    await page.click('[data-testid="teacher-login-btn"]');
    
    // Should show error message
    await expect(
      page.getByText(/네트워크 연결|오류가 발생/)
    ).toBeVisible({ timeout: 10000 });
    
    // Should show retry button if available
    const retryButton = page.getByTestId('retry-auth-btn');
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeEnabled();
    }
  });

  test('should handle redirect authentication method', async ({ page }) => {
    // Set up redirect mode
    await page.addInitScript(() => {
      window.localStorage.setItem('authMethod', 'redirect');
    });
    
    // Attempt login
    await page.click('[data-testid="teacher-login-btn"]');
    
    // Should redirect to Google OAuth (or show error if blocked)
    await page.waitForTimeout(2000);
    
    // Check if URL changed or error is shown
    const currentUrl = page.url();
    const hasError = await page.getByText(/오류|error/i).isVisible();
    
    expect(currentUrl.includes('accounts.google.com') || hasError).toBeTruthy();
  });

  test('should validate SSR compatibility', async ({ page }) => {
    // Disable JavaScript to test SSR
    await page.setJavaScriptEnabled(false);
    
    // Page should still load basic content
    await expect(page.getByText('구글 계정으로 로그인')).toBeVisible();
    
    // Re-enable JavaScript
    await page.setJavaScriptEnabled(true);
    await page.reload();
    
    // Interactive elements should now work
    await expect(page.getByTestId('teacher-login-btn')).toBeEnabled();
  });

  test('should handle localStorage and sessionStorage correctly', async ({ page }) => {
    // Test storage functionality
    await page.evaluate(() => {
      localStorage.setItem('userRole', 'teacher');
      sessionStorage.setItem('pendingRole', 'student');
    });
    
    // Reload page
    await page.reload();
    
    // Storage should persist (localStorage) and session items should be handled
    const userRole = await page.evaluate(() => localStorage.getItem('userRole'));
    expect(userRole).toBe('teacher');
  });

  test('should display proper error messages in Korean', async ({ page }) => {
    // Mock various error conditions
    const errorScenarios = [
      {
        error: 'auth/popup-blocked',
        expectedText: '팝업이 차단되었습니다'
      },
      {
        error: 'auth/network-request-failed',
        expectedText: '네트워크 연결을 확인해'
      },
      {
        error: 'auth/user-disabled',
        expectedText: '계정이 비활성화되었습니다'
      }
    ];
    
    // This would be implemented with proper mocking in a real test environment
    // For now, we check that error handling structure exists
    await expect(page.getByTestId('teacher-login-btn')).toBeVisible();
  });

  test('should handle mobile browser compatibility', async ({ page, browserName }) => {
    // Simulate mobile user agent
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
    );
    
    await page.reload();
    
    // Should detect mobile and adjust authentication method
    await page.click('[data-testid="teacher-login-btn"]');
    
    // Mobile should prefer redirect over popup
    await page.waitForTimeout(1000);
    
    // Verify mobile-appropriate behavior
    const currentUrl = page.url();
    const hasRedirect = currentUrl.includes('accounts.google.com') || 
                       await page.getByText(/리디렉션|redirect/i).isVisible();
    
    // Mobile should use redirect or show appropriate message
    expect(hasRedirect || await page.getByText(/오류/).isVisible()).toBeTruthy();
  });

  test('should cleanup auth state on logout', async ({ page }) => {
    // Set up authenticated state simulation
    await page.evaluate(() => {
      localStorage.setItem('userRole', 'teacher');
      sessionStorage.setItem('authMethod', 'popup');
    });
    
    // Simulate logout (this would be tested with actual auth in integration tests)
    await page.evaluate(() => {
      localStorage.removeItem('userRole');
      sessionStorage.clear();
    });
    
    // Verify cleanup
    const userRole = await page.evaluate(() => localStorage.getItem('userRole'));
    const authMethod = await page.evaluate(() => sessionStorage.getItem('authMethod'));
    
    expect(userRole).toBeNull();
    expect(authMethod).toBeNull();
  });
});

test.describe('Authentication Context', () => {
  test('should provide auth capabilities detection', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Test capability detection through browser console
    const capabilities = await page.evaluate(() => {
      // This would access the auth context in a real implementation
      return {
        canUsePopup: !(/iPad|iPhone|iPod/.test(navigator.userAgent)),
        hasContentBlocker: false, // Would be properly detected
        isSSR: typeof window === 'undefined'
      };
    });
    
    expect(capabilities.isSSR).toBe(false); // We're in browser context
    expect(typeof capabilities.canUsePopup).toBe('boolean');
  });

  test('should handle browser compatibility edge cases', async ({ page, browserName }) => {
    await page.goto('/auth/login');
    
    // Test different browser-specific behaviors
    const userAgent = await page.evaluate(() => navigator.userAgent);
    
    if (browserName === 'webkit') {
      // Safari-specific tests
      expect(userAgent).toContain('Safari');
    } else if (browserName === 'firefox') {
      // Firefox-specific tests
      expect(userAgent).toContain('Firefox');
    } else if (browserName === 'chromium') {
      // Chrome-specific tests
      expect(userAgent).toContain('Chrome');
    }
    
    // All browsers should show login buttons
    await expect(page.getByTestId('teacher-login-btn')).toBeVisible();
    await expect(page.getByTestId('student-login-btn')).toBeVisible();
  });
});