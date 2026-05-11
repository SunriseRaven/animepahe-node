/**
 * airing.js
 * GET /api/airing?page={page}
 */

const { api } = require('../lib/httpClient');
const { success, serverError } = require('../lib/response');

async function airing(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);

  try {
    const response = await api(`/api?m=airing&page=${page}`);
    const json = response.data;

    if (!json || !json.data) {
      return serverError(res, 'Unexpected response from AnimePahe.');
    }

    const results = json.data.map(item => ({
      id:            item.anime_id      ?? null,
      title:         item.anime_title   ?? null,
      session:       item.anime_session ?? null,
      poster:        item.anime_cover   ?? null,
      episode:       item.episode       ?? null,
      episode_title: item.episode_title ?? null,
      snapshot:      item.snapshot      ?? null,
      created_at:    item.created_at    ?? null,
      filler:        item.filler        ?? 0,
    }));

    return success(res, {
      current_page: json.current_page ?? page,
      last_page:    json.last_page    ?? 1,
      total:        json.total        ?? results.length,
      results,
    });
  } catch (err) {
    console.error('[airing]', err.message);
    return serverError(res, 'Failed to reach AnimePahe: ' + err.message);
  }
}

module.exports = { airing };
