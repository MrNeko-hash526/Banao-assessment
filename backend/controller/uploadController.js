const path = require('path');
const prisma = require('../config/db');

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
    if (type === 'profiles' && req.body.userId) {
      const userId = Number(req.body.userId);
      dbResult = await prisma.user.update({ where: { id: userId }, data: { profileImage: relativePath } });
    } else if (type === 'blogs' && req.body.blogId) {
      const blogId = Number(req.body.blogId);
      dbResult = await prisma.blog.update({ where: { id: blogId }, data: { imageUrl: relativePath } });
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
