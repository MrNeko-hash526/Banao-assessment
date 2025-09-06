const prisma = require('../config/db');
const fs = require('fs');
const path = require('path');
const { uploadsDir } = require('../services/upload');

function saveBase64Image(dataUrl, type = 'blogs') {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i);
  if (!match) return null;
  const mime = match[1];
  const extMap = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp' };
  const ext = extMap[mime.toLowerCase()] || 'png';
  const b64 = match[3];
  const buffer = Buffer.from(b64, 'base64');
  const dir = path.join(uploadsDir, type);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, buffer);
  return `/uploads/${type}/${filename}`;
}

function normalizeCategory(raw) {
  if (!raw && raw !== 0) return raw;
  const s = String(raw).trim();
  if (!s) return s;
  // Uppercase, remove non-alphanumeric except spaces, then replace spaces with underscores.
  // Examples:
  //  - "Mental Health" -> "MENTAL_HEALTH"
  //  - "Heart Disease" -> "HEART_DISEASE"
  //  - "Covid-19" -> "COVID19"
  const upper = s.toUpperCase();
  const cleaned = upper.replace(/[^A-Z0-9 ]+/g, '');
  // Try to map to known enum values. Prisma enum names are:
  const known = ['MENTAL_HEALTH', 'HEART_DISEASE', 'COVID19', 'IMMUNIZATION'];
  const candidate = cleaned.replace(/\s+/g, '_').replace(/^_+|_+$/g, '');
  // direct match
  if (known.includes(candidate)) return candidate;
  // match ignoring underscores (accept MENTALHEALTH -> MENTAL_HEALTH)
  const candidateNoUnderscore = candidate.replace(/_/g, '');
  for (const k of known) {
    if (k.replace(/_/g, '') === candidateNoUnderscore) return k;
  }
  // fallback to the best-effort candidate
  return candidate;
}

function countWords(s) {
  if (!s && s !== 0) return 0;
  return String(s).split(/\s+/).filter(Boolean).length;
}

function validateBlogPayload({ title, content, category, summary }) {
  if (!title || !String(title).trim()) return { valid: false, error: 'Title is required' };
  if (!content || !String(content).trim()) return { valid: false, error: 'Content is required' };
  if (!category || !String(category).trim()) return { valid: false, error: 'Category is required' };
  if (!summary || !String(summary).trim()) return { valid: false, error: 'Summary is required' };
  const words = countWords(summary);
  if (words > 50) return { valid: false, error: 'Summary must be 50 words or less' };
  return { valid: true };
}

async function getBlogs(req, res, next) {
  try {
    const { category } = req.query;
    const where = { isDraft: false };
    if (category) {
      const normalized = normalizeCategory(category);
      if (normalized) where.category = normalized;
    }

    const blogs = await prisma.blog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { doctor: { select: { id: true, firstName: true, lastName: true, profileImage: true } } },
    });
    return res.json({ ok: true, data: blogs });
  } catch (e) {
    return next(e);
  }
}

async function getBlogById(req, res, next) {
  try {
    const rawId = req.params.id;
    const id = Number(rawId);
    console.log('getBlogById called with rawId=', rawId, 'parsedNumber=', id, 'req.user=', req.user && { id: req.user.id, userType: req.user.userType });
    const blog = await prisma.blog.findUnique({ where: { id }, include: { doctor: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } });
    if (!blog) {
      console.log('getBlogById: no blog found for id=', id, 'rawId=', rawId);
      return res.status(404).json({ ok: false, error: 'Not found' });
    }
    // allow owner doctor to view their own draft
    if (blog.isDraft) {
      const userId = req.user && Number(req.user.id);
      console.log('getBlogById: blog is draft. ownerId=', blog.doctorId, 'requesterId=', userId);
      if (!userId || Number(blog.doctorId) !== userId) {
        console.log('getBlogById: access denied for draft blog id=', id, 'requester=', userId);
        return res.status(404).json({ ok: false, error: 'Not found' });
      }
    }
    console.log('getBlogById: returning blog id=', id, 'isDraft=', !!blog.isDraft);
    return res.json({ ok: true, data: blog });
  } catch (e) {
    return next(e);
  }
}

async function createBlog(req, res, next) {
  try {
    // require category and summary from the client and allow optional isDraft flag
    const { title, content, category, isDraft, summary } = req.body;
    const validation = validateBlogPayload({ title, content, category, summary });
    if (!validation.valid) return res.status(400).json({ ok: false, error: validation.error });

    const userId = req.user && req.user.id;
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (
      !user || !(user.userType?.toLowerCase() === 'doctor')
    ) {
      return res.status(403).json({ ok: false, error: 'Only doctors can create blogs' });
    }

    const normalizedCategory = normalizeCategory(category);
    if (!normalizedCategory) return res.status(400).json({ ok: false, error: 'Invalid category' });
    // If client submits a base64 image (data URL) in `image`, save it to uploads/blogs and set imageUrl
    let imageUrl = null;
    if (req.body && req.body.image) {
      try {
        const saved = saveBase64Image(req.body.image, 'blogs');
        if (saved) {
          // saved is a relative path like /uploads/blogs/xxxx
          // Use backend host (protocol + host) to form absolute URL so it points to the server, not frontend dev origin
          const origin = `${req.protocol}://${req.get('host')}`;
          imageUrl = saved.startsWith('/') ? `${origin}${saved}` : `${origin}/${saved}`;
        }
      } catch (err) {
        console.error('Failed to save image from payload:', err);
      }
    }

    const blogData = { title, content, summary, category: normalizedCategory, doctorId: Number(userId), isDraft: !!isDraft };
    if (imageUrl) blogData.imageUrl = imageUrl;

    const blog = await prisma.blog.create({
      data: blogData,
      include: { doctor: { select: { id: true, firstName: true, lastName: true, profileImage: true } } },
    });
  console.log('Blog created:', { id: blog.id, isDraft: blog.isDraft, doctorId: blog.doctorId });
    return res.json({ ok: true, data: blog });
  } catch (e) {
    return next(e);
  }
}

async function updateBlog(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ ok: false, error: 'Not found' });

    const userId = req.user && Number(req.user.id);
    if (!userId || Number(existing.doctorId) !== userId) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    const { title, content, category, isDraft, summary, status } = req.body;
    const data = {};
    if (title) data.title = title;
    if (content) data.content = content;
    if (summary) {
      // validate summary length on update
      const words = countWords(summary);
      if (words > 50) return res.status(400).json({ ok: false, error: 'Summary must be 50 words or less' });
      data.summary = summary;
    }
    if (typeof isDraft !== 'undefined') data.isDraft = !!isDraft;
    if (status) data.status = status;
    if (category) {
      const normalized = normalizeCategory(category);
      if (!normalized) return res.status(400).json({ ok: false, error: 'Invalid category' });
      data.category = normalized;
    }

    // handle base64 image in payload (optional)
    if (req.body && req.body.image) {
      try {
        const saved = saveBase64Image(req.body.image, 'blogs');
        if (saved) {
          const origin = `${req.protocol}://${req.get('host')}`;
          data.imageUrl = saved.startsWith('/') ? `${origin}${saved}` : `${origin}/${saved}`;
        }
      } catch (err) {
        console.error('Failed to save image from payload (update):', err);
      }
    }

    const updated = await prisma.blog.update({ where: { id }, data, include: { doctor: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } });
  console.log('Blog updated:', { id: updated.id, isDraft: updated.isDraft, doctorId: updated.doctorId });
    return res.json({ ok: true, data: updated });
  } catch (e) {
    return next(e);
  }
}

async function deleteBlog(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ ok: false, error: 'Not found' });
    const userId = req.user && Number(req.user.id);
    if (!userId || Number(existing.doctorId) !== userId) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    const deleted = await prisma.blog.delete({ where: { id } });
    return res.json({ ok: true, data: deleted });
  } catch (e) {
    return next(e);
  }
}

async function getMyBlogs(req, res, next) {
  try {
    const userId = req.user && Number(req.user.id);
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(user.userType?.toLowerCase() === 'doctor')) return res.status(403).json({ ok: false, error: 'Forbidden' });
    const blogs = await prisma.blog.findMany({ where: { doctorId: userId }, orderBy: { createdAt: 'desc' }, include: { doctor: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } });
    return res.json({ ok: true, data: blogs });
  } catch (e) {
    return next(e);
  }
}

// Debug: return the most recently created blog for the authenticated doctor
async function getLatestBlogForDoctor(req, res, next) {
  try {
    const userId = req.user && Number(req.user.id);
    if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(user.userType?.toLowerCase() === 'doctor')) return res.status(403).json({ ok: false, error: 'Forbidden' });
    const blog = await prisma.blog.findFirst({ where: { doctorId: userId }, orderBy: { createdAt: 'desc' }, include: { doctor: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } });
    if (!blog) return res.status(404).json({ ok: false, error: 'Not found' });
    return res.json({ ok: true, data: blog });
  } catch (e) {
    return next(e);
  }
}

module.exports = { getBlogs, getBlogById, createBlog, updateBlog, deleteBlog, getMyBlogs, getLatestBlogForDoctor };
