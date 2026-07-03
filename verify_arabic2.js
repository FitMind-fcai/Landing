const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

  const dir = 'C:\\Users\\Ahmede\\AppData\\Local\\Temp\\claude\\c--FitMind-Backend\\b717a58e-08dd-44d8-bcfe-65e985740337\\scratchpad\\';
  const shot = (name) => page.screenshot({ path: dir + name + '.png' });

  await page.goto('http://localhost:3000/demo');
  await page.waitForSelector('text=Create your free FitMind account', { timeout: 15000 });
  await page.click('button[aria-label="Switch language"]');
  await page.waitForTimeout(300);

  const email = `arabictest${Date.now()}@example.com`;
  const inputs = await page.$$('input');
  await inputs[0].fill('اختبار عربي');
  await inputs[1].fill(email);
  await inputs[2].fill('password123');
  await page.click('button:has-text("إنشاء حساب")');
  await page.waitForTimeout(3000);
  await shot('10_verify_step_ar');

  // Click continue on verify step (auto-verify is on backend-side)
  await page.click('button:has-text("أكدت")').catch(async () => {
    console.log('Arabic continue button not found, trying English fallback');
  });
  await page.waitForTimeout(2500);
  await shot('11_after_verify_ar');
  console.log('URL after verify click:', page.url());

  // Try clicking a fitness-goal card (first assessment question) if visible
  await page.waitForTimeout(1000);
  await shot('12_assessment_state_ar');

  console.log('Console errors:', JSON.stringify(consoleErrors, null, 2));
  await browser.close();
})();
