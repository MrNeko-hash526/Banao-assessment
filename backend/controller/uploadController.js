const path = require('path');
const prisma = require('../config/db');

function prefixUploadPath(p, req) {
  if (!p || typeof p !== 'string') return p;
  if (!p.startsWith('/uploads')) return p;
  // Prefer the backend's host/port (protocol + host) rather than the incoming Origin header.
  // Origin may be the frontend dev server (vite) which would produce broken URLs.
  const origin = `${req.protocol}://${req.get('host')}`;
  return origin + p;
}

async function handleUpload(req, res) {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });

  // determine public url relative to /uploads
  // file is saved under uploads/<type>/<filename>
  const type = (req.body && req.body.type) || (req.query && req.query.type) || 'profiles';
  const filename = req.file.filename;
  const relativePath = `/uploads/${type}/${filename}`;

  const fileInfo = {
    filename,
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    url: relativePath,
  };

  try {
    let dbResult = null;
    // diagnostics: log uploaded file info and disk check
    try {
      console.log('uploadController: req.file=', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
      const diskPath = req.file && req.file.path ? req.file.path : null;
      if (diskPath) {
        const exists = require('fs').existsSync(diskPath);
        console.log('uploadController: disk file exists?', exists, 'diskPath=', diskPath);
      }
    } catch (diagErr) {
      console.warn('uploadController: diagnostics failed', String(diagErr));
    }
    if (type === 'profiles' && req.body.userId) {
      const userId = Number(req.body.userId);
      dbResult = await prisma.user.update({ where: { id: userId }, data: { profileImage: relativePath } });
    } else if (type === 'blogs' && req.body.blogId) {
      const blogId = Number(req.body.blogId);
      // store absolute URL in DB so clients always get a canonical URL
      const absolute = prefixUploadPath(relativePath, req);
      dbResult = await prisma.blog.update({ where: { id: blogId }, data: { imageUrl: absolute } });
    }

    // If we updated a blog, fetch and decorate it with absolute URLs so client can show images immediately
    if (type === 'blogs' && dbResult) {
      try {
        const blog = await prisma.blog.findUnique({ where: { id: Number(req.body.blogId) }, include: { doctor: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } });
        const decorated = blog ? { ...blog, imageUrl: prefixUploadPath(blog.imageUrl, req), doctor: blog.doctor ? { ...blog.doctor, profileImage: prefixUploadPath(blog.doctor.profileImage, req) } : blog.doctor } : null;
        return res.json({ ok: true, file: fileInfo, db: decorated });
      } catch (e) {
        // fallback to previous behaviour
        return res.json({ ok: true, file: fileInfo, db: dbResult });
      }
    }

    return res.json({ ok: true, file: fileInfo, db: dbResult });
  } catch (e) {
    console.error('Failed to save file url to DB:', e);
    return res.status(500).json({ ok: false, error: 'Uploaded but failed to save metadata', details: String(e) });
  }
}

module.exports = {
  handleUpload,
};
