'use strict';

const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar, Cookie } = require('tough-cookie');

const BASE_URL = process.env.ANIMEPAHE_DOMAIN || 'https://animepahe.pw';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const jar = new CookieJar();
const client = wrapper(axios.create({
  jar,
  withCredentials: true,
  timeout: 30000,
  maxRedirects: 5,
  headers: {
    'User-Agent': USER_AGENT,
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
  },
}));

let bypassReady = false;
let bypassPending = null;

async function solveBypass() {
  console.log('[bypass] Launching Playwright to solve DDoS-Guard...');
  let chromium, playwright;
  try {
    try {
      chromium   = require('@sparticuz/chromium');
      playwright = require('playwright-core');
    } catch {
      playwright = require('playwright');
      chromium   = null;
    }

    const launchOptions = chromium
      ? { args: chromium.args, executablePath: await chromium.executablePath(), headless: true }
      : { headless: true };

    const browser = await playwright.chromium.launch(launchOptions);
    const context = await browser.newContext({ userAgent: USER_AGENT });
    const page    = await context.newPage();

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    const cookies = await context.cookies(BASE_URL);
    await browser.close();

    for (const c of cookies) {
      const cookie = new Cookie({
        key:      c.name,
        value:    c.value,
        domain:   c.domain.replace(/^\./, ''),
        path:     c.path,
        secure:   c.secure,
        httpOnly: c.httpOnly,
      });
      await jar.setCookie(cookie, BASE_URL);
    }

    bypassReady = true;
    console.log(`[bypass] Done — harvested ${cookies.length} cookies.`);
  } catch (err) {
    console.error('[bypass] Playwright failed:', err.message);
    bypassReady = true;
  }
}

async function ensureBypass() {
  if (bypassReady) return;
  if (!bypassPending) {
    bypassPending = solveBypass().finally(() => { bypassPending = null; });
  }
  await bypassPending;
}

async function get(url, extraHeaders = {}) {
  await ensureBypass();
  return client.get(url, {
    headers: extraHeaders,
    validateStatus: (s) => s < 500,
  });
}

async function api(path) {
  const url = `${BASE_URL}${path}`;
  return get(url, {
    'X-Requested-With': 'XMLHttpRequest',
    'Referer':          `${BASE_URL}/`,
    'Accept':           'application/json, text/javascript, */*; q=0.01',
  });
}

function resetBypass() {
  bypassReady  = false;
  bypassPending = null;
}

module.exports = { get, api, resetBypass, BASE_URL };