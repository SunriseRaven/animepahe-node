/**
 * animeInfo.js
 * GET /api/:session  — returns anime metadata from AnimePahe
 *
 * animepahe.php calls this as action=animeInfo and passes it straight through.
 */

const { api } = require('../lib/httpClient');
const { serverError } = require('../lib/response');

async function animeInfo(req, res) {
  const session = (req.params.session || '').trim();

  if (!session) {
    return res.status(400).json({ error: 'session is required.' });
  }

  try {
    // AnimePahe returns anime metadata at /anime/{session}
    const response = await api(`/anime/${encodeURIComponent(session)}`);

    if (!response.data) {
      return serverError(res, 'Unexpected response from AnimePahe.');
    }

    return res.json(response.data);
  } catch (err) {
    console.error('[animeInfo]', err.message);
    return serverError(res, 'Failed to reach AnimePahe: ' + err.message);
  }
}

module.exports = { animeInfo };
