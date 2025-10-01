import Redis from 'ioredis';
import crypto from 'crypto';

const IDEM_HEADER_NAMES = ['idempotency-key','x-idempotency-key','Idempotency-Key','X-Idempotency-Key'];
const UNSAFE = new Set(['POST','PUT','PATCH','DELETE']);
const TTL_SECONDS = 60 * 30;

function pickIdempotencyKey(headers) {
  for (const k of IDEM_HEADER_NAMES) if (headers[k]) return headers[k];
  return undefined;
}
function hashBody(body) {
  return crypto.createHash('sha256').update(JSON.stringify(body || {})).digest('hex');
}

export function idempotency() {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD || undefined;
  const url = process.env.REDIS_URL || `redis://:${password || ''}@${host}:${port}`;

  const redis = new Redis(url);

  return async (req, res, next) => {
    if (!UNSAFE.has(req.method)) return next();

    const idemKey = pickIdempotencyKey(req.headers);
    if (!idemKey) return res.status(400).json({ message: 'Missing Idempotency-Key header' });

    const route = req.baseUrl + req.path;
    const cacheKey = `idem:${route}:${idemKey}`;
    const incomingHash = hashBody(req.body);

    try {
      const cachedRaw = await redis.get(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached.bodyHash !== incomingHash) {
          return res.status(409).json({ message: 'Idempotency-Key already used with different body' });
        }
        res.status(cached.status);
        return res.json(cached.body);
      }

      const originalJson = res.json.bind(res);
      res.json = async (payload) => {
        const status = res.statusCode || 200;
        const value = { status, body: payload, bodyHash: incomingHash };
        await redis.setex(cacheKey, TTL_SECONDS, JSON.stringify(value));
        return originalJson(payload);
      };

      next();
    } catch (e) {
      console.error(`[traceId=${req.traceId}] idempotency error`, e);
      return res.status(500).json({ message: 'Idempotency error' });
    }
  };
}
