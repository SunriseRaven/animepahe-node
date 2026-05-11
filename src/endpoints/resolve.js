/**
 * resolve.js
 * GET /api/resolve?url={kwik_embed_url}
 *
 * Kwik embed pages contain obfuscated JS (p,a,c,k,e,r pattern).
 * We fetch the page, unpack the JS, then extract the .m3u8 URL.
 */

const { get, BASE_URL } = require('../lib/httpClient');
const { success, error, serverError } = require('../lib/response');

// ── p,a,c,k,e,r unpacker (pure JS) ──────────────────────────────────────────

function unpack(packedJs) {
  // Match the packed payload and its arguments
  const match = packedJs.match(
    /eval\(function\(p,a,c,k,e,[d|{].*?\)\)/s
  );
  if (!match) return null;

  // Extract p, a, c, k from the function call arguments
  const argsMatch = match[0].match(
    /\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\(/
  );
  if (!argsMatch) return null;

  let p = argsMatch[1];
  const a = parseInt(argsMatch[2]);
  const k = argsMatch[4].split('|');

  // Decode an integer in base `a` to a string
  function decode(n) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    while (n > 0) {
      result = chars[n % a] + result;
      n = Math.floor(n / a);
    }
    return result || '0';
  }

  // Replace each word token with its dictionary value
  p = p.replace(/\b(\w+)\b/g, (word) => {
    const index = parseInt(word, a);
    return (k[index] && k[index] !== '') ? k[index] : word;
  });

  return p;
}

// ── Core resolver ─────────────────────────────────────────────────────────────

async function resolveKwik(kwikUrl) {
  const referer = BASE_URL + '/';

  const response = await get(kwikUrl, {
    'Referer': referer,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  });

  if (response.status >= 400) {
    throw new Error(`Kwik returned HTTP ${response.status}`);
  }

  const html = typeof response.data === 'string'
    ? response.data
    : JSON.stringify(response.data);

  // Unpack the obfuscated JS block
  const unpacked = unpack(html);
  if (!unpacked) {
    throw new Error('Could not find or unpack packed JS in Kwik page.');
  }

  // Extract .m3u8 URL
  const m3u8Match = unpacked.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/i);
  if (!m3u8Match) {
    throw new Error('Could not find .m3u8 URL in unpacked JS.');
  }

  // Extract pahe.win download URL if present
  const dlMatch = html.match(/https?:\/\/[^\s"']*pahe\.win[^\s"']*/i);

  return {
    kwik_url:     kwikUrl,
    m3u8_url:     m3u8Match[0],
    download_url: dlMatch ? dlMatch[0] : null,
    referer,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

async function resolve(req, res) {
  const url = (req.query.url || '').trim();

  if (!url) return error(res, 'Missing required parameter: url');

  try {
    new URL(url); // validate URL
  } catch {
    return error(res, 'Invalid URL provided.');
  }

  try {
    const result = await resolveKwik(url);
    return success(res, result);
  } catch (err) {
    console.error('[resolve]', err.message);
    return serverError(res, 'Kwik resolution failed: ' + err.message);
  }
}

module.exports = { resolve, resolveKwik };
