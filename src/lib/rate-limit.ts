type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitState>();

export function rateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now > current.resetAt) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: options.max - 1, resetAt };
  }

  current.count += 1;
  if (current.count > options.max) {
    return { ok: false, remaining: 0, resetAt: current.resetAt };
  }

  return { ok: true, remaining: options.max - current.count, resetAt: current.resetAt };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}
