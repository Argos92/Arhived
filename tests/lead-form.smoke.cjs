const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const endpoint = 'https://docs.google.com/forms/d/e/1FAIpQLSeQGYNlbavv5MLaV9T41Ei167Y7scx36wPzPpDxBZ1rZCkPUQ/formResponse';
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/g, '');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] });
  try {
    async function pageFor(configured = true) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      // Every Google request must be intercepted; never create real test leads.
      await page.context().setOffline(true);
      await page.setContent(html);
      await page.addStyleTag({ content: css });
      const config = configured ? fs.readFileSync(path.join(root, 'lead-form-config.js'), 'utf8') : `window.ARHIVED_LEAD_FORM={endpoint:${JSON.stringify(endpoint)},fields:{name:'',contacts:'',research:''}};`;
      await page.addScriptTag({ content: config });
      await page.addScriptTag({ content: app });
      await page.locator('[data-open]').first().click();
      return page;
    }
    const page = await pageFor();
    let submissions = 0, payload;
    await page.route(endpoint, async route => {
      submissions++;
      payload = new URLSearchParams(route.request().postData());
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.fulfill({ status: 200, body: '<html>Mock Google response</html>' });
    });
    assert.equal(await page.locator('#lead-form input, #lead-form textarea').count(), 3);
    await page.locator('#lead-name').fill('   ');
    await page.locator('#lead-contacts').fill('test@example.com');
    await page.locator('#lead-research').fill('Что известно о родственниках?');
    await page.locator('#lead-form button[type=submit]').click();
    assert.equal(submissions, 0, 'Whitespace names must not be sent');
    await page.locator('#lead-name').fill(' Анна Тестовая ');
    await page.locator('#lead-form button[type=submit]').click();
    await page.locator('#lead-form').evaluate(form => form.dispatchEvent(new Event('submit', { cancelable: true })));
    await page.waitForFunction(() => !document.querySelector('#lead-form button[type=submit]').disabled);
    assert.equal(submissions, 1, 'Double submit prevented');
    assert.equal(payload.get('entry.1403494991'), 'Анна Тестовая');
    assert.equal(payload.get('entry.306918152'), 'test@example.com');
    assert.equal(payload.get('entry.13855598'), 'Что известно о родственниках?');
    assert.match(await page.locator('#form-status').textContent(), /не подтверждено/);
    await page.locator('#lead-research').fill('Вторая заявка: история другой ветви семьи');
    await page.locator('#lead-form button[type=submit]').click();
    await page.waitForFunction(() => !document.querySelector('#lead-form button[type=submit]').disabled);
    assert.equal(submissions, 2, 'A second intentional submission is allowed');
    assert.equal(payload.get('entry.13855598'), 'Вторая заявка: история другой ветви семьи');
    assert.equal(await page.locator('#lead-form button[type=submit]').textContent(), 'Отправить заявку');
    assert.equal(page.url(), 'about:blank', 'No navigation to Google');
    assert.equal(await page.locator('iframe').count(), 0, 'No embedded Google form');
    for (const width of [375, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    const failed = await pageFor();
    await failed.route(endpoint, route => route.abort('failed'));
    await failed.locator('#lead-name').fill('Проверка ошибки');
    await failed.locator('#lead-contacts').fill('@example');
    await failed.locator('#lead-research').fill('История семьи');
    await failed.locator('#lead-form button[type=submit]').click();
    await failed.waitForFunction(() => document.querySelector('#form-status').classList.contains('submission-error'));
    assert.equal(await failed.locator('#lead-name').inputValue(), 'Проверка ошибки');
    assert.equal(await failed.locator('#lead-form button[type=submit]').isEnabled(), true);
    const unconfigured = await pageFor(false);
    assert.equal(await unconfigured.locator('#lead-form button[type=submit]').isDisabled(), true);
    console.log('PASS: three fields, mapping, trimmed validation, no navigation, no concurrent duplicate send, repeat submissions, honest opaque-response state, network failure, missing configuration, four widths (mock transport only)');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
