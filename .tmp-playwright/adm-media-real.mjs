import { chromium } from 'playwright';
import path from 'path';

const siteUrl = 'https://anderson0617.github.io/anderson-carpintaria-reformas/';
const uploadFile = 'C:/Users/Admin/Desktop/Anderson-Carpintaria-Reformas/assets/CAPA-TOPO-73.jpeg';

const logs = [];
const requests = [];
const responses = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
page.on('request', req => {
  const url = req.url();
  if (url.includes('supabase.co') || url.includes('editable_media_assets') || url.includes('site-gallery')) {
    requests.push({ method: req.method(), url });
  }
});
page.on('response', async res => {
  const url = res.url();
  if (url.includes('supabase.co') || url.includes('editable_media_assets') || url.includes('site-gallery')) {
    let body = '';
    try { body = await res.text(); } catch {}
    responses.push({ status: res.status(), url, body: body.slice(0, 400) });
  }
});

await page.goto(siteUrl, { waitUntil: 'networkidle' });
await page.click('button.admin-key');
await page.fill('.password-modal__content input[type="password"]', '2805');
await page.click('.password-modal__content button[type="submit"]');
await page.waitForSelector('.admin-panel', { state: 'visible' });

const beforeSrc = await page.locator('.portrait-ring img').getAttribute('src');
const photoLabel = page.locator('.admin-media-grid label.admin-field').filter({ hasText: 'Foto de apresentação' });
await photoLabel.locator('input[type="file"]').setInputFiles(uploadFile);
await page.click('text=Subir para o Supabase');
await page.waitForTimeout(4000);

const uploadStatus = await page.locator('.admin-footer__status').nth(0).textContent();
const afterSrc = await page.locator('.portrait-ring img').getAttribute('src');

const context2 = await browser.newContext();
const page2 = await context2.newPage();
const logs2 = [];
page2.on('console', msg => logs2.push(`${msg.type()}: ${msg.text()}`));
await page2.goto(siteUrl, { waitUntil: 'networkidle' });
await page2.waitForTimeout(2000);
const secondSrc = await page2.locator('.portrait-ring img').getAttribute('src');

console.log('ADM_BEFORE_SRC=' + beforeSrc);
console.log('ADM_AFTER_SRC=' + afterSrc);
console.log('SECOND_CONTEXT_SRC=' + secondSrc);
console.log('UPLOAD_STATUS=' + uploadStatus);
console.log('REQUESTS=' + JSON.stringify(requests, null, 2));
console.log('RESPONSES=' + JSON.stringify(responses, null, 2));
console.log('CONSOLE_1=' + JSON.stringify(logs, null, 2));
console.log('CONSOLE_2=' + JSON.stringify(logs2, null, 2));

await context.close();
await context2.close();
await browser.close();
