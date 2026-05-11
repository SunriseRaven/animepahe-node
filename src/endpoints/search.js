/**
 * search.js
 * GET /api/search?q={title}
 */

const { api } = require('../lib/httpClient');
const { success, error, serverError } = require('../lib/response');

async function search(req, res) {
  const q = (req.query.q || '').trim();

  if (!q) return error(res, 'Missing required parameter: q');

  try {
    const response = await api(`/api?m=search&q=${encodeURIComponent(q)}`);

    console.log('[search] status:', response.status);
    console.log('[search] data:', JSON.stringify(response.data).slice(0, 500));

    if (!response.data || !response.data.data) {
      return serverError(res, 'Unexpected response: ' + JSON.stringify(response.data).slice(0, 200));
    }

    const results = response.data.data.map(item => ({
      id:      item.id      ?? null,
      title:   item.title   ?? null,
      type:    item.type    ?? null,
      year:    item.year    ?? null,
      status:  item.status  ?? null,
      season:  item.season  ?? null,
      score:   item.score   ?? null,
      poster:  item.poster  ?? null,
      session: item.session ?? null,
    }));

    return success(res, { total: results.length, results });
  } catch (err) {
    console.error('[search]', err.message);
    return serverError(res, 'Failed to reach AnimePahe: ' + err.message);
  }
}

module.exports = { search };