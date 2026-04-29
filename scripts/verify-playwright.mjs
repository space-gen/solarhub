import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const PORT = 4173;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  const devServer = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
  });

  const serverReady = await new Promise((resolve, reject) => {
    let settled = false;
    const startedAt = Date.now();

    const tick = async () => {
      if (settled) return;

      if (Date.now() - startedAt > 30000) {
        settled = true;
        reject(new Error('Timed out waiting for Vite dev server to start'));
        return;
      }

      try {
        const response = await fetch(`${BASE_URL}/#/`);
        if (response.ok || response.status === 304) {
          settled = true;
          resolve(true);
          return;
        }
      } catch {
        // Keep polling until timeout.
      }

      setTimeout(() => { void tick(); }, 500);
    };

    devServer.on('exit', (code) => {
      if (!settled) {
        settled = true;
        reject(new Error(`Dev server exited early with code ${code ?? 'unknown'}`));
      }
    });

    void tick();
  });

  if (!serverReady) throw new Error('Dev server did not become ready');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/#/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const homeTitle = page.locator('text=SolarHub');
    await homeTitle.first().waitFor({ timeout: 10000 });

    await page.goto(`${BASE_URL}/#/connect`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const connectCopy = await page.locator('text=solarhub-data').count();
    assert(connectCopy > 0, 'Connect page does not mention solarhub-data');

    const progressCopy = await page.locator('text=progress.json').count();
    assert(progressCopy > 0, 'Connect page does not mention progress.json');

    await page.goto(`${BASE_URL}/#/classify/sunspot`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const noImages = await page.locator('text=No images available yet').count();
    const allDone = await page.locator('text=All done for today in this category').count();
    assert(noImages === 0 && allDone === 0, 'No pending classify task available, submit UI cannot render');

    const submitButton = page.locator('button').filter({ hasText: /Observation|Mark & label at least one region/i });
    const hasSubmit = await submitButton.count();
    assert(hasSubmit > 0, 'Submit button area was not rendered on classify page');

    console.log('PLAYWRIGHT_VERIFY_OK: home/connect/classify submit UI rendered');
  } finally {
    await context.close();
    await browser.close();
    devServer.kill('SIGTERM');
  }
}

run().catch((error) => {
  console.error('PLAYWRIGHT_VERIFY_FAIL:', error.message);
  process.exit(1);
});
