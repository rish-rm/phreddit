export function createMemoryRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 20,
  keyPrefix = "rate-limit",
  message = "Too many requests. Please try again later.",
  now = () => Date.now()
} = {}) {
  const attempts = new Map();

  return function memoryRateLimiter(req, res, next) {
    if (process.env.DISABLE_RATE_LIMIT === "true") {
      next();
      return;
    }

    const timestamp = now();
    const key = [
      keyPrefix,
      req.ip || req.socket?.remoteAddress || "unknown",
      req.path || req.originalUrl || ""
    ].join(":");
    const current = attempts.get(key);

    if (!current || current.resetAt <= timestamp) {
      attempts.set(key, { count: 1, resetAt: timestamp + windowMs });
      next();
      return;
    }

    if (current.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - timestamp) / 1000));
      res.set("Retry-After", String(retryAfterSeconds));
      res.status(429).json({ error: message });
      return;
    }

    current.count += 1;
    next();
  };
}

export const authRateLimiter = createMemoryRateLimiter({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  keyPrefix: "auth",
  message: "Too many authentication attempts. Please wait and try again."
});
