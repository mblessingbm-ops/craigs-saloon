/* Lightweight in-memory sliding-window rate limiter.

   Per-instance only: state is not shared across serverless instances and resets
   on cold start. That's enough to blunt a single sender flooding the WhatsApp
   bot (each inbound can trigger a paid outbound). For strict, cross-instance
   limits, swap the Map for Upstash / Vercel KV behind the same signature. */

const buckets = new Map<string, number[]>();

/** Returns true if the action is allowed, false if `key` has hit `limit`
 *  within the trailing `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);

  // bound memory: occasionally drop empty/expired buckets
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      const kept = v.filter((t) => t > cutoff);
      if (kept.length === 0) buckets.delete(k);
      else buckets.set(k, kept);
    }
  }
  return true;
}
