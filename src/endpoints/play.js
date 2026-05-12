/**
 * play.js
 * GET /api/play/:session?episodeId={episodeSession}&downloads=true|false
 *
 * Combines sources + Kwik resolution into a single call.
 * Returns { sources: [{label, url, isM3U8, isDub}], downloads: [] }
 * which is exactly what animepahe.php and app.js expect.
 */

const { api } = require('../lib/httpClient');
const { resolveKwik } = require('./resolve');
const { serverError } = require('../lib/response');

async function play(req, res) {
  const animeSession   = (req.params.session  || '').trim();
  const episodeSession = (req.query.episodeId || '').trim();
  const inclDownloads  = req.query.downloads === 'true';

  if (!animeSession || !episodeSession) {
    return res.status(400).json({ error: 'session and episodeId are required.' });
  }

  try {
    // Step 1: Get Kwik links from AnimePahe
    const linksRes = await api(
      `/api?m=links&id=${encodeURIComponent(animeSession)}&session=${encodeURIComponent(episodeSession)}&p=kwik`
    );

   const linksJson = linksRes.data;
console.log('[play] links raw:', JSON.stringify(linksJson).slice(0, 500));
if (!linksJson || !linksJson.data || !linksJson.data.length) {
  return res.status(502).json({ 
    error: 'No sources returned from AnimePahe.',
    raw: JSON.stringify(linksJson).slice(0, 300)
  });
}

    // Step 2: Resolve each Kwik link to a direct .m3u8 concurrently
    const resolveResults = await Promise.allSettled(
      linksJson.data.map(async (s) => {
        const kwikUrl = s.kwik;
        if (!kwikUrl) return null;

        try {
          const resolved = await resolveKwik(kwikUrl);
          return {
            label:   s.quality  ?? 'Stream',
            quality: s.quality  ?? null,
            audio:   s.audio    ?? 'jpn',
            isDub:   (s.audio ?? 'jpn') !== 'jpn',
            url:     resolved.m3u8_url,
            isM3U8:  true,
            referer: resolved.referer,
            kwik:    kwikUrl,
            pahewin: resolved.download_url ?? null,
          };
        } catch (err) {
          console.warn(`[play] Failed to resolve ${kwikUrl}:`, err.message);
          return null;
        }
      })
    );

    // Step 3: Filter successful resolutions
    const sources = resolveResults
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    if (!sources.length) {
      return res.status(502).json({
        error: 'All Kwik resolutions failed. The streams may be temporarily unavailable.',
      });
    }

    // Step 4: Build download links if requested
    const downloads = [];
    if (inclDownloads) {
      sources.forEach(s => {
        if (s.pahewin) {
          downloads.push({
            label:   s.quality ?? 'Download',
            quality: s.quality ?? null,
            url:     s.pahewin,
          });
        }
      });
    }

    return res.json({ sources, downloads });
  } catch (err) {
    console.error('[play]', err.message);
    return res.status(500).json({ error: 'Playback failed: ' + err.message });
  }
}

module.exports = { play };
