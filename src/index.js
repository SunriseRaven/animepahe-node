/**
 * index.js
 * Main Express app — AnimePahe Node.js API Wrapper
 *
 * Routes:
 *   GET /api/search?q={title}
 *   GET /api/anime?session={s}&page={n}
 *   GET /api/sources?anime_session={s}&episode_session={s}
 *   GET /api/resolve?url={kwik_embed_url}
 *   GET /api/download?url={pahewin_url}
 *   GET /api/airing?page={n}
 *   GET /api/          → lists all routes
 */

'use strict';

const express    = require('express');
const rateLimiter = require('./middleware/rateLimiter');
const { search }   = require('./endpoints/search');
const { anime }    = require('./endpoints/anime');
const { sources }  = require('./endpoints/sources');
const { resolve }  = require('./endpoints/resolve');
const { download } = require('./endpoints/download');
const { airing }   = require('./endpoints/airing');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin',  '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Rate limiting on all /api routes
app.use('/api', rateLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────

// Index — list all available routes
app.get(['/api', '/api/'], (req, res) => {
  res.json({
    status:  'success',
    message: 'AnimePahe Node.js API — Ready',
    data: {
      name:    'animepahe-node-api',
      version: '1.0.0',
      routes: [
        {
          method: 'GET', path: '/api/search',
          params: { q: 'Search query (required)' },
          description: 'Search anime by title',
        },
        {
          method: 'GET', path: '/api/anime',
          params: { session: 'Anime session UUID (required)', page: 'Page number (default 1)' },
          description: 'Get anime info and paginated episode list',
        },
        {
          method: 'GET', path: '/api/sources',
          params: { anime_session: 'Anime session UUID (required)', episode_session: 'Episode session hash (required)' },
          description: 'Get Kwik streaming links for an episode',
        },
        {
          method: 'GET', path: '/api/resolve',
          params: { url: 'Kwik embed URL (required)' },
          description: 'Resolve a Kwik URL to a direct .m3u8 stream',
        },
        {
          method: 'GET', path: '/api/download',
          params: { url: 'pahe.win download page URL (required)' },
          description: 'Resolve a pahe.win URL to a direct .mp4 download link',
        },
        {
          method: 'GET', path: '/api/airing',
          params: { page: 'Page number (default 1)' },
          description: 'Get currently airing anime with latest episodes',
        },
      ],
    },
  });
});

app.get('/api/search',   search);
app.get('/api/anime',    anime);
app.get('/api/sources',  sources);
app.get('/api/resolve',  resolve);
app.get('/api/download', download);
app.get('/api/airing',   airing);

// ── 404 handler ───────────────────────────────────────────────────────────────
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
