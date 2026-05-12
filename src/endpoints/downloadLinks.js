/**
 * downloadLinks.js
 * GET /api/play/download-links?url={pahewin_url}
 *
 * Matches what animepahe.php calls as action=downloadLink.
 */

const { get } = require('../lib/httpClient');
const { serverError } = require('../lib/response');

function extractDownloadLink(html) {
  let m = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"'\s>]+)/i);
  if (m) return m[1];

  m = html.match(/(?:window\.location|location\.href)\s*=\s*["']([^"']+\.mp4[^"']*)['"]/);
  if (m) return m[1];

  m = html.match(/<a[^>]+href=["']([^"']+\.mp4[^"']*)['"]/i);
  if (m) return m[1].replace(/&amp;/g, '&');

  m = html.match(/https?:\/\/[^\s"']+\.mp4[^\s"']*/i);
  if (m) return m[0];

  return null;
}

async function downloadLinks(req, res) {
  const url = (req.query.url || '').trim();

  if (!url) {
    return res.status(400).json({ error: 'url is required.' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL provided.' });
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

    return res.json({
      url:      directUrl,
      referer:  url,
      note:     `Send "${url}" as Referer header when downloading.`,
    });
  } catch (err) {
    console.error('[downloadLinks]', err.message);
    return serverError(res, 'Failed to resolve download link: ' + err.message);
  }
}

module.exports = { downloadLinks };
