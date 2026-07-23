const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function sameOriginAsRequest(origin, req) {
  const host = req.get("host");
  if (!host) return false;
  return origin === `${req.protocol}://${host}`;
}

export function createTrustedOriginGuard({
  allowedOrigins = new Set(),
  enforce = process.env.NODE_ENV === "production"
} = {}) {
  return function trustedOriginGuard(req, res, next) {
    if (!enforce || SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    const origin = req.get("origin");
    if (
      origin &&
      (allowedOrigins.has(origin) || sameOriginAsRequest(origin, req))
    ) {
      next();
      return;
    }

    res.status(403).json({
      error: "Request origin is not allowed."
    });
  };
}
