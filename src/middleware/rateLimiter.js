/**
 * rateLimiter.js
 * Sliding window rate limiter using in-memory Maps.
 * - IP-based:      60 req/min
 * - API key-based: 120 req/min (keys bypass IP limit)
 */

const fs = require('fs');
const path = require('path');
const KEYS_FILE = path.join(__dirname, '../../config/api_keys.json');

const IP_LIMIT     = 60;
const KEY_LIMIT    = 120;
const WINDOW_MS    = 60 * 1000; // 1 minute

// In-memory stores: id -> array of timestamps
const store = new Map();

function getWindow(id, limit) {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  let timestamps = (store.get(id) || []).filter(t => t > cutoff);
  const allowed = timestamps.length < limit;

  if (allowed) {
    timestamps.push(now);
    store.set(id, timestamps);
  }

  const oldest = timestamps[0] || now;
  const resetAt = Math.ceil((oldest + WINDOW_MS) / 1000);
  const retryAfter = allowed ? 0 : Math.ceil((oldest + WINDOW_MS - now) / 1000);

  return {
    allowed,
    limit,
    count: timestamps.length,
    remaining: Math.max(0, limit - timestamps.length),
    resetAt,
    retryAfter,
  };
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket.remoteAddress || '0.0.0.0';
}

function extractApiKey(req) {
  return req.headers['x-api-key'] || req.query.api_key || null;
}

function loadKeys() {
  try {
    if (!fs.existsSync(KEYS_FILE)) return [];
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function sendHeaders(res, result, type) {
  res.set('X-RateLimit-Type',      type);
  res.set('X-RateLimit-Limit',     String(result.limit));
  res.set('X-RateLimit-Remaining', String(result.remaining));
  res.set('X-RateLimit-Reset',     String(result.resetAt));
  if (!result.allowed) {
    res.set('Retry-After', String(result.retryAfter));
  }
}

function rateLimiter(req, res, next) {
  const apiKey = extractApiKey(req);

  if (apiKey) {
    const keys = loadKeys();
    if (!keys.includes(apiKey)) {
      return res.status(401).json({ status: 'error', message: 'Invalid API key.', data: null });
    }

    const result = getWindow('key_' + apiKey, KEY_LIMIT);
    sendHeaders(res, result, 'api_key');

    if (!result.allowed) {
      return res.status(429).json({
        status: 'error',
        message: `API key rate limit exceeded. Limit: ${KEY_LIMIT} req/min. Retry after ${result.retryAfter}s.`,
        data: null,
      });
    }

    return next();
  }

  // IP-based
  const ip = getClientIp(req);
  const result = getWindow('ip_' + ip, IP_LIMIT);
  sendHeaders(res, result, 'ip');

  if (!result.allowed) {
    return res.status(429).json({
      status: 'error',
      message: `Rate limit exceeded. Limit: ${IP_LIMIT} req/min. Retry after ${result.retryAfter}s. Use an API key for higher limits.`,
      data: null,
    });
  }

  next();
}

module.exports = rateLimiter;
