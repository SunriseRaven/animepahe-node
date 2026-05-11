/**
 * sources.js
 * GET /api/sources?anime_session={s}&episode_session={s}
 */

const { api } = require('../lib/httpClient');
const { success, error, serverError } = require('../lib/response');

async function sources(req, res) {
  const animeSession   = (req.query.anime_session   || '').trim();
  const episodeSession = (req.query.episode_session || '').trim();

  if (!animeSession || !episodeSession) {
    return error(res, 'Missing required parameters: anime_session, episode_session');
  }

  try {
    const response = await api(
      `/api?m=links&id=${encodeURIComponent(animeSession)}&session=${encodeURIComponent(episodeSession)}&p=kwik`
    );

    const json = response.data;
    if (!json || !json.data) {
      return serverError(res, 'Unexpected response from AnimePahe.');
    }

    const srcs = json.data.map(s => ({
      quality:      s.quality       ?? null,
      audio:        s.audio         ?? 'jpn',
      kwik_url:     s.kwik          ?? null,
      kwik_pahewin: s.kwik_pahewin  ?? null,
      file_size:    s.filesize       ?? null,
      hd:           s.hd === 1,
    }));

    return success(res, { anime_session: animeSession, episode_session: episodeSession, sources: srcs });
  } catch (err) {
    console.error('[sources]', err.message);
    return serverError(res, 'Failed to reach AnimePahe: ' + err.message);
  }
}

module.exports = { sources };
