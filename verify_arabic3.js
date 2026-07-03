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
  await page.waitForTimeout(2500);

  await page.click('button:has-text("أكدت")');
  await page.waitForTimeout(2000);
  await shot('20_fitness_goal_ar');

  // Step 1: fitness goal -> click first card
  await page.click('text=عايز أخس');
  await page.click('button:has-text("التالي")');
  await page.waitForTimeout(600);
  await shot('21_gender_ar');

  // Step 2: gender
  await page.click('text=ذكر');
  await page.click('button:has-text("التالي")');
  await page.waitForTimeout(600);
  await shot('22_weight_ar'); // number stepper

  await page.click('button:has-text("التالي")');
  await page.waitForTimeout(600);
  await shot('23_height_ar');

  await page.click('button:has-text("التالي")');
  await page.waitForTimeout(600);
  await shot('24_age_ar');

  await page.click('button:has-text("التالي")');
  await page.waitForTimeout(600);
  await shot('25_fitness_level_slider_ar'); // slider step - Beginner/Elite captions

  await page.click('button:has-text("التالي")');
  await page.waitForTimeout(600);
  await shot('26_limitations_chips_ar'); // chips step

  await page.click('button:has-text("التالي")');
  await page.waitForTimeout(600);
  await shot('27_allergies_chips_ar'); // another chips step

  console.log('Console errors:', JSON.stringify(consoleErrors, null, 2));
  await browser.close();
})();
