/**
 * httpClient.js
 * Axios-based HTTP client with spoofed browser headers and cookie jar
 * to handle Cloudflare protection on AnimePahe.
 */

const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const BASE_URL = process.env.ANIMEPAHE_DOMAIN || 'https://animepahe.pw';

const jar = new CookieJar();
const client = wrapper(axios.create({
  jar,
  withCredentials: true,
  timeout: 30000,
  maxRedirects: 5,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
  },
}));

/**
 * General-purpose GET — pass any URL with optional extra headers.
 */
async function get(url, extraHeaders = {}) {
  const response = await client.get(url, {
    headers: extraHeaders,
    validateStatus: (s) => s < 500,
  });
  return response;
}

/**
 * AnimePahe internal API GET — sets required XHR headers automatically.
 */
async function api(path) {
  const url = `${BASE_URL}${path}`;
  return get(url, {
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': `${BASE_URL}/`,
    'Accept': 'application/json, text/javascript, */*; q=0.01',
  });
}

module.exports = { get, api, BASE_URL };
