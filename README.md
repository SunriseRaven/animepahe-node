# AnimePahe Node.js API Wrapper

Unofficial REST API wrapper for AnimePahe — built with Node.js + Express, designed to run on Termux.

---

## 📁 Project Structure

```
animepahe-node/
├── src/
│   ├── index.js                  ← Express app + router
│   ├── lib/
│   │   ├── httpClient.js         ← Axios client with CF bypass headers
│   │   └── response.js           ← Standardized JSON response helpers
│   ├── middleware/
│   │   └── rateLimiter.js        ← Sliding window rate limiter
│   └── endpoints/
│       ├── search.js             ← GET /api/search
│       ├── anime.js              ← GET /api/anime
│       ├── sources.js            ← GET /api/sources
│       ├── resolve.js            ← GET /api/resolve (Kwik → .m3u8)
│       ├── download.js           ← GET /api/download
│       └── airing.js             ← GET /api/airing
├── config/
│   └── api_keys.json             ← Managed by keyman.js
├── keyman.js                     ← CLI key manager
└── package.json
```

---

## ⚙️ Termux Setup

### 1. Install Node.js
```bash
pkg update && pkg upgrade
pkg install nodejs
```

### 2. Install dependencies
```bash
cd animepahe-node
npm install
```

### 3. Start the server
```bash
npm start
# or for auto-reload during development:
npm run dev
```

Server runs on `http://localhost:3000` by default.

---

## 🌐 API Endpoints

Base URL: `http://localhost:3000`

---

### 🔍 Search
```
GET /api/search?q={title}
```
```bash
curl "http://localhost:3000/api/search?q=naruto"
```
```json
{
  "status": "success",
  "data": {
    "total": 2,
    "results": [
      {
        "id": 1,
        "title": "Naruto",
        "type": "TV",
        "year": 2002,
        "session": "abc123-uuid",
        "poster": "https://..."
      }
    ]
  }
}
```

---

### 📋 Anime Info + Episode List
```
GET /api/anime?session={session}&page={page}
```
```bash
curl "http://localhost:3000/api/anime?session=abc123-uuid&page=1"
```
Returns paginated episodes. Each episode has a `session` hash needed for `/api/sources`.

---

### 🎬 Episode Sources (Kwik Links)
```
GET /api/sources?anime_session={s}&episode_session={s}
```
```bash
curl "http://localhost:3000/api/sources?anime_session=abc123&episode_session=def456hash"
```
Returns available quality options (360p, 720p, 1080p) with Kwik embed URLs.

---

### ▶️ Resolve Kwik → Direct .m3u8
```
GET /api/resolve?url={kwik_embed_url}
```
```bash
curl "http://localhost:3000/api/resolve?url=https://kwik.si/e/AbCdEf123"
```
```json
{
  "status": "success",
  "data": {
    "kwik_url": "https://kwik.si/e/AbCdEf123",
    "m3u8_url": "https://na-304.cdn.kwikcnd.com/.../index.m3u8",
    "download_url": "https://pahe.win/XYZ",
    "referer": "https://animepahe.pw/"
  }
}
```
> ⚠️ When streaming the `.m3u8`, you **must** send the `referer` value as the `Referer` header or playback will be rejected (e.g. in VLC: `--http-referrer`).

---

### ⬇️ Resolve Download Link
```
GET /api/download?url={pahewin_url}
```
```bash
curl "http://localhost:3000/api/download?url=https://pahe.win/XYZ"
```
Returns the direct `.mp4` CDN URL. Send the `pahe.win` URL as `Referer` when downloading.

---

### 📡 Currently Airing
```
GET /api/airing?page={page}
```
```bash
curl "http://localhost:3000/api/airing?page=1"
```

---

## 🔄 Full Usage Flow

```
1. Search
   GET /api/search?q=one+piece
   → grab anime session UUID

2. Episode list
   GET /api/anime?session={uuid}&page=1
   → grab episode session hash

3. Streaming sources
   GET /api/sources?anime_session={uuid}&episode_session={hash}
   → grab kwik_url for desired quality

4a. Stream
    GET /api/resolve?url={kwik_url}
    → get .m3u8 URL + referer → play in VLC

4b. Download
    GET /api/download?url={pahewin_url}
    → get direct .mp4 URL → download with curl/wget
```

---

## 🔒 Rate Limiting

All `/api` routes are rate limited. Responses include headers:

```
X-RateLimit-Type:      ip
X-RateLimit-Limit:     60
X-RateLimit-Remaining: 47
X-RateLimit-Reset:     1715421060
Retry-After:           12        ← only on 429 responses
```

| Caller | Limit |
|--------|-------|
| No API key | 60 req/min (per IP) |
| Valid API key | 120 req/min (per key) |
| Invalid API key | 401 Unauthorized |

---

## 🗝️ API Key Management

```bash
# Generate a key
node keyman.js generate julius_local

# List all keys
node keyman.js list

# Revoke a key
node keyman.js revoke julius_local_abc123def456...
```

**Using a key in requests:**
```bash
# Via header (recommended)
curl -H "X-API-Key: julius_local_abc123..." "http://localhost:3000/api/search?q=naruto"

# Via query param
curl "http://localhost:3000/api/search?q=naruto&api_key=julius_local_abc123..."
```

---

## ⚙️ Environment Variables

```bash
# Override AnimePahe domain (it changes often)
export ANIMEPAHE_DOMAIN=https://animepahe.pw

# Change port (default: 3000)
export PORT=8080
```

---

## ⚠️ Notes

| Issue | Detail |
|-------|--------|
| **Cloudflare** | Uses spoofed browser headers + cookie jar. Works for basic CF protection. |
| **Kwik unpacker** | Pure JS `p,a,c,k,e,r` unpacker. Update `resolve.js` if Kwik changes obfuscation. |
| **Domain changes** | AnimePahe changes domains often. Set `ANIMEPAHE_DOMAIN` env var to update without code changes. |
| **Referer required** | `.m3u8` streaming and `.mp4` downloads both require the correct `Referer` header. |

---

## 📄 License

MIT — Unofficial. Not affiliated with AnimePahe.
