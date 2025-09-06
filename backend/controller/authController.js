const authService = require('../services/authService');

async function getSignups(req, res) {
  const result = await authService.getSignups();
  if (!result.ok) return res.status(500).json(result);
  // prefix profileImage with origin so frontend can load it
  const origin = req.protocol + '://' + req.get('host');
  const data = (result.data || []).map((u) => {
    const copy = { ...u };
    if (copy.profileImage && copy.profileImage.startsWith('/uploads')) copy.profileImage = origin + copy.profileImage;
    if (copy.password) delete copy.password;
    return copy;
  });
  return res.json({ ok: true, data });
}

async function saveSignup(req, res) {
  const result = await authService.saveSignup(req.body, req.file);
    if (result.ok) {
    // if a user was created in DB, return a safe user object and issue a token
    if (result.user) {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'dev-secret';
      const payload = { id: result.user.id, email: result.user.email, userType: result.user.userType };
      const token = jwt.sign(payload, secret, { expiresIn: '7d' });

      const safeUser = { ...result.user };
      if (safeUser.password) delete safeUser.password;
      // prefix profileImage
      const origin = req.protocol + '://' + req.get('host');
      if (safeUser.profileImage && safeUser.profileImage.startsWith('/uploads')) safeUser.profileImage = origin + safeUser.profileImage;

      return res.json({ ok: true, user: safeUser, token });
    }
    return res.json(result);
  }
  if (result.error === 'Email already registered') return res.status(409).json(result);
  if (result.error === 'Email is required') return res.status(400).json(result);
  return res.status(500).json(result);
}

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password are required' });

  const user = await authService.authenticateUser(email, password);
  if (!user) return res.status(401).json({ ok: false, error: 'Invalid email or password' });

  // Sign JWT (do not return hashed password)
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'dev-secret';
  const payload = { id: user.id, email: user.email, userType: user.userType };
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });

  // clone user without password and prefix profileImage
  const safeUser = { ...user };
  if (safeUser.password) delete safeUser.password;
  const origin = req.protocol + '://' + req.get('host');
  if (safeUser.profileImage && safeUser.profileImage.startsWith('/uploads')) safeUser.profileImage = origin + safeUser.profileImage;

  return res.json({ ok: true, user: safeUser, token });
}

module.exports = {
  getSignups,
  saveSignup,
  login,
  // return current user for authenticated requests
  async me(req, res) {
    try {
      const payload = req.user || {};
      const prisma = require('../config/db');
      if (!payload || (!payload.id && !payload.email)) return res.status(401).json({ ok: false, error: 'Unauthorized' });

      // Try to find user by numeric id first (Prisma common case), then by email.
      let u = null;
      const tryId = payload.id;
      if (tryId !== undefined && tryId !== null) {
        const num = Number(tryId);
        if (!Number.isNaN(num)) {
          u = await prisma.user.findUnique({ where: { id: num } });
        }
      }

      if (!u && payload.email) {
        u = await prisma.user.findUnique({ where: { email: String(payload.email).toLowerCase() } });
      }

      // As a last-ditch attempt, try matching raw id if it is a string id stored in DB
      if (!u && payload.id) {
        try {
          u = await prisma.user.findUnique({ where: { id: payload.id } });
        } catch (e) {
          // ignore type errors from mismatched id types
        }
      }

      if (!u) return res.status(404).json({ ok: false, error: 'Not found' });

      const safe = { ...u };
      if (safe.password) delete safe.password;
      const origin = req.protocol + '://' + req.get('host');
      if (safe.profileImage && safe.profileImage.startsWith('/uploads')) safe.profileImage = origin + safe.profileImage;
      return res.json({ ok: true, user: safe });
    } catch (e) {
      console.error('Error in auth.me', e);
      return res.status(500).json({ ok: false, error: String(e) });
    }
  }
};
