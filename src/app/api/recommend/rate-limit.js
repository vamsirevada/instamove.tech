import { createHash } from 'node:crypto'
import { isIP } from 'node:net'

function positiveInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

const limit = positiveInteger(process.env.RECOMMEND_RATE_LIMIT, 8)
const windowMs = positiveInteger(process.env.RECOMMEND_RATE_WINDOW_SECONDS, 60) * 1000
const localBuckets = new Map()
let nextSweep = 0

const takeSlot = `
local count = tonumber(redis.call('GET', KEYS[1])) or 0
if count >= tonumber(ARGV[1]) then
  return { count, redis.call('PTTL', KEYS[1]), 0 }
end
count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[2]) end
return { count, redis.call('PTTL', KEYS[1]), 1 }
`

function clientKey(request) {
  const ip = process.env.VERCEL === '1'
    ? request.headers.get('x-vercel-forwarded-for')?.trim()
    : null
  const identity = ip && isIP(ip) ? ip : 'local'
  return createHash('sha256').update(identity).digest('hex')
}

function consumeLocal(key, now) {
  if (now >= nextSweep) {
    for (const [address, bucket] of localBuckets) {
      if (bucket.expiresAt <= now) localBuckets.delete(address)
    }
    nextSweep = now + windowMs
  }

  let bucket = localBuckets.get(key)
  if (!bucket || bucket.expiresAt <= now) {
    bucket = { used: 0, expiresAt: now + windowMs }
    localBuckets.set(key, bucket)
  }
  const allowed = bucket.used < limit
  if (allowed) bucket.used++
  return [bucket.used, bucket.expiresAt - now, Number(allowed)]
}

async function consumeShared(url, token, key) {
  const namespace = process.env.VERCEL_ENV || process.env.NODE_ENV
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['EVAL', takeSlot, 1, `instamovie:recommend:${namespace}:${key}`, limit, windowMs]),
    cache: 'no-store',
    signal: AbortSignal.timeout(1500),
  })
  const data = await response.json()
  if (!response.ok || !Array.isArray(data.result) || data.result.length !== 3 ||
      !data.result.every(Number.isSafeInteger) || data.result[1] < 0 ||
      ![0, 1].includes(data.result[2])) {
    throw new Error('Shared rate limiter unavailable')
  }
  return data.result
}

export async function limitRecommendation(request) {
  const key = clientKey(request)
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (Boolean(url) !== Boolean(token)) throw new Error('Incomplete shared rate limiter configuration')

  const [used, ttl, allowed] = url
    ? await consumeShared(url, token, key)
    : consumeLocal(key, Date.now())

  return {
    allowed: allowed === 1,
    retryAfter: Math.max(1, Math.ceil(ttl / 1000)),
    headers: {
      'Cache-Control': 'no-store',
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(Math.max(0, limit - used)),
      'X-RateLimit-Reset': String(Math.ceil((Date.now() + ttl) / 1000)),
    },
  }
}
