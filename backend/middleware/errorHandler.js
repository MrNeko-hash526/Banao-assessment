module.exports = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  const status = err && err.status ? err.status : 500;
  const payload = { ok: false, error: err && err.message ? err.message : 'Internal Server Error' };
  if (!isProd && err && err.stack) payload.stack = err.stack;
  res.status(status).json(payload);
};
