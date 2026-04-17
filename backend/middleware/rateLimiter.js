import rateLimit from 'express-rate-limit';

function isLocalhostRequest(req) {
  const ip = req.ip || '';
  const hostname = req.hostname || '';

  return (
    hostname === 'localhost'
    || hostname === '127.0.0.1'
    || ip === '127.0.0.1'
    || ip === '::1'
    || ip === '::ffff:127.0.0.1'
  );
}

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skip: (req) => isLocalhostRequest(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many auth requests. Please try again in a minute.',
  },
});
