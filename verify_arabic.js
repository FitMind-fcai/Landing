const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

  const shot = (name) => page.screenshot({ path: `C:\\Users\\Ahmede\\AppData\\Local\\Temp\\claude\\c--FitMind-Backend\\b717a58e-08dd-44d8-bcfe-65e985740337\\scratchpad\\${name}.png` });

  await page.goto('http://localhost:3000/demo');
  await page.waitForSelector('text=Create your free FitMind account', { timeout: 15000 });

  // Switch to Arabic right away
  await page.click('button[aria-label="Switch language"]');
  await page.waitForTimeout(500);
  await shot('01_account_ar');

  // Sign up a fresh test user
  const email = `arabictest${Date.now()}@example.com`;
  await page.fill('input[type="text"], input[name="name"]', 'اختبار عربي').catch(() => {});
  const inputs = await page.$$('input');
  console.log('input count:', inputs.length);
  // Fill by order: name, email, password (matches AccountStep typical layout)
  await inputs[0].fill('اختبار عربي');
  await inputs[1].fill(email);
  await inputs[2].fill('password123');
  await shot('02_account_filled_ar');

  await page.click('button:has-text("إنشاء حساب"), button[type="submit"]');
  await page.waitForTimeout(3000);
  await shot('03_after_signup_ar');

  // Might land on profile assessment step directly (auto-verified)
  await page.waitForTimeout(1500);
  await shot('04_current_state_ar');

  console.log('URL:', page.url());
  console.log('Console errors:', JSON.stringify(consoleErrors, null, 2));

  await browser.close();
})();
