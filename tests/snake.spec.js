const { test, expect } = require('@playwright/test');

test.describe('Snake game', () => {
  test('loads with start prompt and zeroed score', async ({ page }) => {
    await page.goto('/games/?open=snake');

    await expect(page.locator('#snakeOverlayTitle')).toHaveText('snake');
    await expect(page.locator('#snakeOverlaySub')).toHaveText('press an arrow key or wasd to start');
    await expect(page.locator('#snakeScore')).toHaveText('0');
  });

  test('starting the game hides the overlay', async ({ page }) => {
    await page.goto('/games/?open=snake');

    await page.keyboard.press('ArrowUp');

    await expect(page.locator('#snakeOverlay')).toHaveClass(/is-hidden/);
  });
});

test.describe('Games desktop', () => {
  test('opens a game window from its icon and closes it again', async ({ page }) => {
    await page.goto('/games/');

    await expect(page.locator('[data-window="snake"]')).toBeHidden();

    await page.click('[data-open="snake"]');
    await expect(page.locator('[data-window="snake"]')).toBeVisible();
    await expect(page.locator('[data-window="snake"]')).toHaveClass(/is-focused/);

    await page.click('[data-close="snake"]');
    await expect(page.locator('[data-window="snake"]')).toBeHidden();
  });

  test('keys only reach the focused game', async ({ page }) => {
    await page.goto('/games/');
    await page.click('[data-open="snake"]');
    await page.click('[data-open="tunnel"]'); // tunnel now has focus

    await page.keyboard.press(' ');

    // Space starts driftwalk and must not touch the snake behind it.
    await expect(page.locator('#tunnelOverlay')).toHaveClass(/is-hidden/);
    await expect(page.locator('#snakeOverlay')).not.toHaveClass(/is-hidden/);
  });

  test('a window can be dragged by its title bar', async ({ page }) => {
    await page.goto('/games/?open=snake');
    const win = page.locator('[data-window="snake"]');
    const before = await win.evaluate((el) => el.getBoundingClientRect().left);

    const bar = await page.locator('[data-window="snake"] .console__bar').boundingBox();
    await page.mouse.move(bar.x + 150, bar.y + 10);
    await page.mouse.down();
    await page.mouse.move(bar.x + 290, bar.y + 120, { steps: 10 });
    await page.mouse.up();

    const after = await win.evaluate((el) => el.getBoundingClientRect().left);
    expect(after).toBeGreaterThan(before + 100);
  });
});

test.describe('Snake leaderboard', () => {
  // Pin food to the cell directly right of the starting head so a run scores.
  const pinFood = (page) => page.addInitScript(() => { Math.random = () => 207.5 / 397; });

  // Serve the leaderboard from an in-memory store. Without this the suite
  // would append a row to the real Supabase board on every run.
  const fakeBackend = async (page) => {
    const rows = [];
    await page.route('**/rest/v1/leaderboard*', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        const row = JSON.parse(req.postData() || '{}');
        rows.push(row);
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([row]) });
      }
      const top = [...rows].sort((a, b) => b.score - a.score);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(top) });
    });
  };

  test.beforeEach(async ({ page }) => {
    await fakeBackend(page);
  });

  const scoreThenDie = async (page) => {
    await page.keyboard.press('ArrowRight'); // start, eat the pinned food
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowUp'); // run into the top wall
    await expect(page.locator('#snakeOverlayTitle')).toHaveText('game over');
  };

  test('offers initials entry for a qualifying run and lists the score', async ({ page }) => {
    await pinFood(page);
    await page.goto('/games/?open=snake');
    await expect(page.locator('#leaderboardStatus')).toHaveText('no scores yet, be the first');

    await scoreThenDie(page);
    await expect(page.locator('#scoreEntry')).toBeVisible();

    await page.fill('#scoreInitials', 'MWC');
    await page.click('#scoreSubmit');

    await expect(page.locator('#scoreEntry')).toBeHidden();
    const row = page.locator('.leaderboard__row').first();
    await expect(row).toContainText('MWC');
    await expect(row).toHaveClass(/is-you/);
  });

  test('typing initials does not steer or restart the game', async ({ page }) => {
    await pinFood(page);
    await page.goto('/games/?open=snake');
    await scoreThenDie(page);

    // 'w' and 'r' are movement/restart keys outside the field.
    await page.keyboard.type('wrd');

    await expect(page.locator('#scoreInitials')).toHaveValue('WRD');
    await expect(page.locator('#snakeOverlay')).not.toHaveClass(/is-hidden/);
  });

  test('rejects an incomplete name', async ({ page }) => {
    await pinFood(page);
    await page.goto('/games/?open=snake');
    await scoreThenDie(page);

    await page.fill('#scoreInitials', 'AB');
    await page.click('#scoreSubmit');

    await expect(page.locator('#scoreEntryError')).toHaveText('three letters, a to z');
    await expect(page.locator('#scoreEntry')).toBeVisible();
  });
});
