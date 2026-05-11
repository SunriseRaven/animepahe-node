/**
 * download.js
 * GET /api/download?url={pahewin_url}
 *
 * Resolves a pahe.win download page to a direct .mp4 CDN link.
 * IMPORTANT: When fetching the actual .mp4, send the pahe.win URL as Referer.
 */

const { get } = require('../lib/httpClient');
const { success, error, serverError } = require('../lib/response');

function extractDownloadLink(html) {
  // Method 1: meta refresh
  let m = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"'\s>]+)/i);
  if (m) return m[1];

  // Method 2: window.location / location.href with .mp4
  m = html.match(/(?:window\.location|location\.href)\s*=\s*["']([^"']+\.mp4[^"']*)['"]/);
  if (m) return m[1];

  // Method 3: <a href> with .mp4
  m = html.match(/<a[^>]+href=["']([^"']+\.mp4[^"']*)['"]/i);
  if (m) return m[1].replace(/&amp;/g, '&');

  // Method 4: form action pointing to CDN
  m = html.match(/<form[^>]+action=["']([^"']+)['"]/i);
  if (m && (m[1].includes('.mp4') || m[1].includes('cdn'))) return m[1];

  // Method 5: bare .mp4 URL anywhere in source
  m = html.match(/https?:\/\/[^\s"']+\.mp4[^\s"']*/i);
  if (m) return m[0];

  return null;
}

async function download(req, res) {
  const url = (req.query.url || '').trim();

  if (!url) return error(res, 'Missing required parameter: url');

  try {
    new URL(url);
  } catch {
    return error(res, 'Invalid URL provided.');
  }

  try {
    const response = await get(url, {
      'Referer': 'https://kwik.si/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    });

    const html = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data);

    const directUrl = extractDownloadLink(html);

    if (!directUrl) {
      return serverError(res, 'Could not extract download link from page.');
    }

    return success(res, {
      download_page: url,
      direct_url:    directUrl,
      note:          `Send "${url}" as Referer header when downloading the direct URL.`,
    });
  } catch (err) {
    console.error('[download]', err.message);
    return serverError(res, 'Failed to resolve download link: ' + err.message);
  }
}

module.exports = { download };
