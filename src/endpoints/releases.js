/**
 * releases.js
 * GET /api/:session/releases?sort=episode_asc&page=1
 *
 * Matches what animepahe.php expects from the upstream API.
 * Wraps the same AnimePahe release data but in the shape the frontend needs.
 */

const { api } = require('../lib/httpClient');
const { success, serverError } = require('../lib/response');

async function releases(req, res) {
  const session = (req.params.session || '').trim();
  const page    = Math.max(1, parseInt(req.query.page) || 1);
  const sort    = ['episode_asc', 'episode_desc'].includes(req.query.sort)
    ? req.query.sort : 'episode_asc';

  if (!session) {
    return res.status(400).json({ error: 'session is required.' });
  }

  try {
    const response = await api(
      `/api?m=release&id=${encodeURIComponent(session)}&sort=${sort}&page=${page}`
    );
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
      audio:      ep.audio      ?? 'jpn',
    }));

    // Return paginationInfo shape that animepahe.php normalizes
    return res.json({
      paginationInfo: {
        currentPage: json.current_page ?? page,
        lastPage:    json.last_page    ?? 1,
        total:       json.total        ?? episodes.length,
        perPage:     json.per_page     ?? episodes.length,
      },
      data: episodes,
    });
  } catch (err) {
    console.error('[releases]', err.message);
    return serverError(res, 'Failed to reach AnimePahe: ' + err.message);
  }
}

module.exports = { releases };
