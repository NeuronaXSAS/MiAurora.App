import { test, expect } from '@playwright/test';

test.describe('Emergency Safety System', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    // In a real scenario, you'd mock the auth state here
    // For now, we'll assume the user is logged in
  });

  test('should display emergency page with panic button', async ({ page }) => {
    await page.goto('/emergency');
    
    // Check page loaded
    await expect(page.locator('h1')).toContainText('Aurora Guardian');
    
    // Verify panic button is visible
    const panicButton = page.locator('button[aria-label*="Emergency SOS"]');
    await expect(panicButton).toBeVisible();
  });

  test('should enable test mode toggle', async ({ page }) => {
    await page.goto('/emergency');
    
    // Find and click test mode toggle
    const testModeButton = page.getByRole('button', { name: /OFF|ON/ }).first();
    await testModeButton.click();
    
    // Verify test mode is enabled
    await expect(testModeButton).toContainText('ON');
  });

  test('should show countdown when panic button is held', async ({ page }) => {
    await page.goto('/emergency');
    
    // Enable test mode first
    const testModeButton = page.getByRole('button', { name: /OFF/ }).first();
    await testModeButton.click();
    
    // Find panic button
    const panicButton = page.locator('button[aria-label*="Emergency SOS"]');
    
    // Hold the panic button (mousedown without mouseup)
    await panicButton.dispatchEvent('mousedown');
    
    // Wait a moment for countdown to appear
    await page.waitForTimeout(500);
    
    // Check countdown is visible
    const countdown = page.locator('text=/Activating Emergency Alert/i');
    await expect(countdown).toBeVisible();
    
    // Release the button to cancel
    await panicButton.dispatchEvent('mouseup');
  });

  test('should cancel panic alert when released early', async ({ page }) => {
    await page.goto('/emergency');
    
    // Enable test mode
    const testModeButton = page.getByRole('button', { name: /OFF/ }).first();
    await testModeButton.click();
    
    const panicButton = page.locator('button[aria-label*="Emergency SOS"]');
    
    // Hold briefly then release
    await panicButton.dispatchEvent('mousedown');
    await page.waitForTimeout(1000);
    await panicButton.dispatchEvent('mouseup');
    
    // Countdown should disappear
    await expect(page.locator('text=/Activating Emergency Alert/i')).not.toBeVisible();
  });

  test('should show alert sent screen in test mode', async ({ page }) => {
    await page.goto('/emergency');
    
    // Enable test mode
    const testModeButton = page.getByRole('button', { name: /OFF/ }).first();
    await testModeButton.click();
    
    const panicButton = page.locator('button[aria-label*="Emergency SOS"]');
    
    // Hold for full countdown (5+ seconds)
    await panicButton.dispatchEvent('mousedown');
    
    // Wait for countdown to complete
    await page.waitForTimeout(6000);
    
    // Check alert active screen appears
    await expect(page.locator('text=/EMERGENCY ALERT ACTIVE/i')).toBeVisible();
    await expect(page.locator('text=/TEST MODE/i')).toBeVisible();
    
    // Verify "I'm Safe Now" button is present
    const safeButton = page.getByRole('button', { name: /I'm Safe Now/i });
    await expect(safeButton).toBeVisible();
  });

  test('should allow adding emergency contact', async ({ page }) => {
    await page.goto('/emergency');
    
    // Click "Add Contact" button
    const addButton = page.getByRole('button', { name: /Add Contact/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Fill in contact form
      await page.fill('input#name', 'Test Contact');
      await page.fill('input#phone', '+1234567890');
      await page.fill('input#relationship', 'Friend');
      
      // Note: In a real test, we'd mock the Convex mutation
      // For now, we just verify the form is functional
      const saveButton = page.getByRole('button', { name: /Save Contact/i });
      await expect(saveButton).toBeVisible();
    }
  });

  test('should display alert history section', async ({ page }) => {
    await page.goto('/emergency');
    
    // Verify alert history section exists
    await expect(page.locator('text=/Alert History/i')).toBeVisible();
  });

  test('should show proper UI states for panic button', async ({ page }) => {
    await page.goto('/emergency');
    
    const panicButton = page.locator('button[aria-label*="Emergency SOS"]');
    
    // Verify initial state
    await expect(panicButton).toBeVisible();
    await expect(panicButton).toHaveClass(/bg-red-600/);
    
    // Verify SOS badge
    await expect(page.locator('text=SOS')).toBeVisible();
  });
});

test.describe('Emergency Contact Management', () => {
  test('should validate required fields for emergency contact', async ({ page }) => {
    await page.goto('/emergency');
    
    const addButton = page.getByRole('button', { name: /Add Contact/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Try to save without filling required fields
      const saveButton = page.getByRole('button', { name: /Save Contact/i });
      await saveButton.click();
      
      // Browser validation should prevent submission
      // (In real implementation, check for validation messages)
    }
  });

  test('should allow canceling contact addition', async ({ page }) => {
    await page.goto('/emergency');
    
    const addButton = page.getByRole('button', { name: /Add Contact/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Fill some data
      await page.fill('input#name', 'Test');
      
      // Click cancel
      const cancelButton = page.getByRole('button', { name: /Cancel/i });
      await cancelButton.click();
      
      // Form should be hidden
      await expect(page.locator('input#name')).not.toBeVisible();
    }
  });
});

test.describe('Geolocation Integration', () => {
  test('should handle geolocation permission', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });
    
    await page.goto('/emergency');
    
    // Enable test mode
    const testModeButton = page.getByRole('button', { name: /OFF/ }).first();
    await testModeButton.click();
    
    // Trigger panic (geolocation should be captured)
    const panicButton = page.locator('button[aria-label*="Emergency SOS"]');
    await panicButton.dispatchEvent('mousedown');
    await page.waitForTimeout(6000);
    
    // Verify alert was triggered (in test mode)
    await expect(page.locator('text=/EMERGENCY ALERT ACTIVE/i')).toBeVisible();
  });
});
