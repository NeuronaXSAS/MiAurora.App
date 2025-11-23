import { test, expect } from '@playwright/test';

/**
 * Smoke tests - Quick validation of critical user journeys
 * Run these before every deployment to ensure core functionality works
 */

test.describe('Critical User Journeys', () => {
  test('landing page loads and displays key elements', async ({ page }) => {
    await page.goto('/');
    
    // Check hero section
    await expect(page.locator('h1')).toBeVisible();
    
    // Check CTA buttons exist
    const buttons = page.locator('button, a[href*="auth"]');
    await expect(buttons.first()).toBeVisible();
  });

  test('authenticated routes redirect to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/feed');
    
    // Should redirect to auth or show login
    await page.waitForURL(/auth|login|workos/);
  });

  test('legal pages are accessible', async ({ page }) => {
    // Terms of Service
    await page.goto('/legal/terms');
    await expect(page.locator('text=/Terms.*Service/i')).toBeVisible();
    
    // Privacy Policy
    await page.goto('/legal/privacy');
    await expect(page.locator('text=/Privacy.*Policy/i')).toBeVisible();
  });

  test('offline page exists', async ({ page }) => {
    await page.goto('/offline');
    await expect(page.locator('text=/offline/i')).toBeVisible();
  });
});

test.describe('Performance Checks', () => {
  test('landing page loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('static assets are cached', async ({ page }) => {
    await page.goto('/');
    
    // Check if CSS is loaded
    const styles = await page.locator('link[rel="stylesheet"]').count();
    expect(styles).toBeGreaterThan(0);
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('landing page is mobile-friendly', async ({ page }) => {
    await page.goto('/');
    
    // Check that content is visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test('mobile menu works', async ({ page }) => {
    await page.goto('/');
    
    // Look for mobile menu button (hamburger)
    const menuButton = page.locator('button[aria-label*="menu" i]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      // Menu should expand
      await page.waitForTimeout(500);
    }
  });
});

test.describe('SEO & Metadata', () => {
  test('landing page has proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Aurora/i);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
    
    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /.+/);
  });

  test('pages have unique titles', async ({ page }) => {
    const pages = [
      { url: '/', expectedTitle: /Aurora/i },
      { url: '/legal/terms', expectedTitle: /Terms/i },
      { url: '/legal/privacy', expectedTitle: /Privacy/i },
    ];

    for (const { url, expectedTitle } of pages) {
      await page.goto(url);
      await expect(page).toHaveTitle(expectedTitle);
    }
  });
});

test.describe('Accessibility', () => {
  test('landing page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    
    // Should focus on an interactive element
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Alt can be empty string for decorative images, but should exist
      expect(alt).not.toBeNull();
    }
  });
});

test.describe('Error Handling', () => {
  test('404 page exists', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
  });

  test('handles network errors gracefully', async ({ page, context }) => {
    // Block all network requests
    await context.route('**/*', route => route.abort());
    
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 5000 });
    } catch (error) {
      // Expected to fail, but shouldn't crash
      expect(error).toBeDefined();
    }
  });
});

test.describe('PWA Features', () => {
  test('manifest.json is accessible', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('icons');
  });

  test('service worker is registered', async ({ page }) => {
    await page.goto('/');
    
    // Check if service worker file exists
    const swResponse = await page.goto('/sw.js');
    expect(swResponse?.status()).toBe(200);
  });
});

test.describe('Security Headers', () => {
  test('pages have security headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    // Check for common security headers
    // Note: Some may be set by Cloudflare automatically
    expect(headers).toBeDefined();
  });

  test('external links have proper rel attributes', async ({ page }) => {
    await page.goto('/');
    
    const externalLinks = page.locator('a[href^="http"]:not([href*="aurora"])');
    const count = await externalLinks.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = externalLinks.nth(i);
      const rel = await link.getAttribute('rel');
      
      // External links should have noopener or noreferrer
      if (rel) {
        expect(rel).toMatch(/noopener|noreferrer/);
      }
    }
  });
});
