/**
 * index.js
 * Main Express app — AnimePahe Node.js API Wrapper
 *
 * Original routes (standalone use):
 *   GET /api/search?q=
 *   GET /api/anime?session=&page=
 *   GET /api/sources?anime_session=&episode_session=
 *   GET /api/resolve?url=
 *   GET /api/download?url=
 *   GET /api/airing?page=
 *
 * AnimeKaiju-compatible routes (matches what animepahe.php expects):
 *   GET /api/:session/releases?sort=&page=
 *   GET /api/play/:session?episodeId=&downloads=
 *   GET /api/play/download-links?url=
 *   GET /api/:session   (anime info)
 */

'use strict';

const express      = require('express');
const rateLimiter  = require('./middleware/rateLimiter');

const { search }        = require('./endpoints/search');
const { anime }         = require('./endpoints/anime');
const { sources }       = require('./endpoints/sources');
const { resolve }       = require('./endpoints/resolve');
const { download }      = require('./endpoints/download');
const { airing }        = require('./endpoints/airing');
const { releases }      = require('./endpoints/releases');
const { play }          = require('./endpoints/play');
const { animeInfo }     = require('./endpoints/animeInfo');
const { downloadLinks } = require('./endpoints/downloadLinks');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(express.json());

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin',  '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/api', rateLimiter);

// ── Index ─────────────────────────────────────────────────────────────────────
app.get(['/api', '/api/'], (req, res) => {
  res.json({
    status: 'success',
    message: 'AnimePahe Node.js API — Ready',
    data: {
      name: 'animepahe-node-api',
      version: '1.1.0',
      routes: [
        { method: 'GET', path: '/api/search',                      params: { q: 'required' } },
        { method: 'GET', path: '/api/anime',                       params: { session: 'required', page: 'default 1' } },
        { method: 'GET', path: '/api/sources',                     params: { anime_session: 'required', episode_session: 'required' } },
        { method: 'GET', path: '/api/resolve',                     params: { url: 'Kwik embed URL' } },
        { method: 'GET', path: '/api/download',                    params: { url: 'pahe.win URL' } },
        { method: 'GET', path: '/api/airing',                      params: { page: 'default 1' } },
        { method: 'GET', path: '/api/:session/releases',           params: { sort: 'episode_asc', page: 'default 1' } },
        { method: 'GET', path: '/api/play/:session',               params: { episodeId: 'required', downloads: 'true|false' } },
        { method: 'GET', path: '/api/play/download-links',         params: { url: 'pahe.win URL' } },
        { method: 'GET', path: '/api/:session',                    description: 'Anime info' },
      ],
    },
  });
});

// ── Original routes ───────────────────────────────────────────────────────────
app.get('/api/search',   search);
app.get('/api/anime',    anime);
app.get('/api/sources',  sources);
app.get('/api/resolve',  resolve);
app.get('/api/download', download);
app.get('/api/airing',   airing);

// ── AnimeKaiju-compatible routes ──────────────────────────────────────────────
// IMPORTANT: specific paths before wildcard /:session routes
app.get('/api/play/download-links',  downloadLinks);
app.get('/api/play/:session',        play);
app.get('/api/:session/releases',    releases);
app.get('/api/:session',             animeInfo);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route not found: ${req.path}`, data: null });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[unhandled]', err.message);
  res.status(500).json({ status: 'error', message: 'Internal server error.', data: null });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AnimePahe API running on http://localhost:${PORT}`);
  console.log(`   Docs : http://localhost:${PORT}/api`);
  console.log(`   Keys : node keyman.js generate myapp\n`);
});
