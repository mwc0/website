const { test, expect } = require('@playwright/test');

test.describe('Snake game', () => {
  test('loads with start prompt and zeroed score', async ({ page }) => {
    await page.goto('/games/snake/');

    await expect(page.locator('#snakeOverlayTitle')).toHaveText('snake');
    await expect(page.locator('#snakeOverlaySub')).toHaveText('press an arrow key or wasd to start');
    await expect(page.locator('#snakeScore')).toHaveText('0');
  });

  test('starting the game hides the overlay', async ({ page }) => {
    await page.goto('/games/snake/');

    await page.keyboard.press('ArrowUp');

    await expect(page.locator('#snakeOverlay')).toHaveClass(/is-hidden/);
  });
});
