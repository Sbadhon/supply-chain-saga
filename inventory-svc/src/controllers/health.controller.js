import os from 'os';
import { query } from '../db.js';
import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const SERVICE_NAME = process.env.SERVICE_NAME || (process.env.npm_package_name ?? 'inventory-svc');

function mkRedis() {
  return new Redis(REDIS_PORT, REDIS_HOST, { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 800 });
}

async function checkDb() {
  const t = Date.now();
  try {
    await query('SELECT 1');
    return { ok: true, latencyMs: Date.now() - t };
  } catch (e) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}

async function checkRedis() {
  const t = Date.now();
  const client = mkRedis();
  try {
    await client.connect();
    const pong = await client.ping();
    await client.quit();
    return { ok: pong === 'PONG', latencyMs: Date.now() - t };
  } catch (e) {
    try { await client.quit(); } catch {}
    return { ok: false, error: e?.message ?? String(e) };
  }
}

export async function liveness(_req, res) {
  res.json({
    status: 'UP',
    service: SERVICE_NAME,
    pid: process.pid,
    uptimeSec: Math.round(process.uptime()),
    hostname: os.hostname(),
    now: new Date().toISOString(),
  });
}

export async function readiness(_req, res) {
  const [db, redis] = await Promise.all([checkDb(), checkRedis()]);
  const allOk = db.ok;
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'READY' : 'DEGRADED',
    service: SERVICE_NAME,
    deps: { db, redis },
    time: new Date().toISOString(),
  });
}

export async function full(_req, res) {
  const [db, redis] = await Promise.all([checkDb(), checkRedis()]);
  res.json({
    status: (db.ok && redis.ok) ? 'UP' : 'ISSUES',
    service: SERVICE_NAME,
    version: process.env.npm_package_version,
    pid: process.pid,
    uptimeSec: Math.round(process.uptime()),
    deps: { db, redis },
    env: { node: process.version, port: process.env.PORT, dbHost: process.env.DB_HOST, dbName: process.env.DB_NAME },
    now: new Date().toISOString(),
  });
}
