import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

test('should return to page 1 when deleting the last item on page 2', async ({ page }) => {
  // Create 6 settings via API (page size is 5, so this creates 2 pages)
  const uids: string[] = [];
  for (let i = 0; i < 6; i++) {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `pagination-test-${i}` }),
    });
    const data = await response.json();
    uids.push(data.uid);
  }

  try {
    await page.goto('/');
    await page.waitForSelector('.setting-item');

    // Should show 5 items on first page
    const items = page.locator('.setting-item');
    await expect(items).toHaveCount(5);

    // Navigate to page 2
    await page.click('#next-btn');
    await page.waitForTimeout(500);

    // Should show 1 item on second page
    await expect(items).toHaveCount(1);
    const pageInfo = page.locator('#page-info');
    await expect(pageInfo).toHaveText('Page 2 of 2');

    // Delete the only item on page 2
    page.on('dialog', dialog => dialog.accept());
    await page.click('.btn-delete');

    // Wait for page to reload
    await page.waitForTimeout(500);

    // Should now be on page 1 with 5 items (not stuck on empty page 2)
    await expect(items).toHaveCount(5);
    await expect(pageInfo).toHaveText('Page 1 of 1');
  } finally {
    // Clean up remaining settings
    for (const uid of uids) {
      await fetch(`${API_BASE_URL}/settings/${uid}`, { method: 'DELETE' }).catch(() => {});
    }
  }
});
