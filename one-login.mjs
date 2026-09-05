import { chromium } from './node_modules/playwright/index.mjs';
import dotenv from './node_modules/dotenv/lib/main.js';
dotenv.config();
const U = 'HORSTM', P = process.env.DEFAULT_PASSWORD_1;
const b = await chromium.launch({ headless: false, slowMo: 50, args: ['--start-maximized'] });
const c = await b.newContext({ viewport: null });
const p = await c.newPage();
await p.goto(process.env.BASE_URL, { waitUntil: 'domcontentloaded' });
await p.getByRole('textbox', { name: 'Username*' }).waitFor({ state: 'visible', timeout: 30000 });
await p.getByRole('textbox', { name: 'Username*' }).fill(U);
await p.getByRole('textbox', { name: 'Password*' }).fill(P);
await p.getByRole('button', { name: 'Login' }).click();
// Poll for 60s, logging url + key text every 10s
for (let i = 0; i < 6; i++) {
  await p.waitForTimeout(10000);
  const url = p.url();
  const wb = await p.getByRole('menuitem', { name: 'Workbench' }).isVisible().catch(()=>false);
  const body = (await p.locator('body').innerText().catch(()=>'')).replace(/\s+/g,' ').slice(0,120);
  console.log(`T+${(i+1)*10}s wb=${wb} url=${url.slice(-45)} :: ${body}`);
  if (wb) { await c.storageState({ path: 'playwright/.auth/HORSTM.json' }); console.log('SAVED'); break; }
}
await p.screenshot({ path: 'reports/artifacts/probe-postlogin.png', fullPage: true });
await b.close();
