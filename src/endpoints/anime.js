/**
 * anime.js
 * GET /api/anime?session={session}&page={page}
 */

const { api } = require('../lib/httpClient');
const { success, error, serverError } = require('../lib/response');

async function anime(req, res) {
  const session = (req.query.session || '').trim();
  const page    = Math.max(1, parseInt(req.query.page) || 1);

  if (!session) return error(res, 'Missing required parameter: session');

  try {
    const response = await api(`/api?m=release&id=${encodeURIComponent(session)}&sort=episode_asc&page=${page}`);
    const json = response.data;

    if (!json || !json.data) {
      return serverError(res, 'Unexpected response from AnimePahe.');
    }

    const episodes = json.data.map(ep => ({
      id:         ep.id         ?? null,
      episode:    ep.episode    ?? null,
      title:      ep.title      ?? null,
      snapshot:   ep.snapshot   ?? null,
      duration:   ep.duration   ?? null,
      created_at: ep.created_at ?? null,
      session:    ep.session    ?? null,
      filler:     ep.filler     ?? 0,
    }));

    return success(res, {
      session,
      current_page: json.current_page ?? page,
      last_page:    json.last_page    ?? 1,
      per_page:     json.per_page     ?? episodes.length,
      total:        json.total        ?? episodes.length,
      episodes,
    });
  } catch (err) {
    console.error('[anime]', err.message);
    return serverError(res, 'Failed to reach AnimePahe: ' + err.message);
  }
}

module.exports = { anime };
