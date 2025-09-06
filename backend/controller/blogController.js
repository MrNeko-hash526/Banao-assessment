const prisma = require('../config/db');

async function getBlogs(req, res, next) {
  try {
    const blogs = await prisma.blog.findMany({
      where: { isDraft: false },
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
    const id = Number(req.params.id);
    const blog = await prisma.blog.findUnique({ where: { id }, include: { doctor: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } });
    if (!blog) return res.status(404).json({ ok: false, error: 'Not found' });
    if (blog.isDraft) return res.status(404).json({ ok: false, error: 'Not found' });
    return res.json({ ok: true, data: blog });
  } catch (e) {
    return next(e);
  }
}

async function createBlog(req, res, next) {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ ok: false, error: 'Title and content required' });
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.userType !== 'doctor') return res.status(403).json({ ok: false, error: 'Only doctors can create blogs' });
    const blog = await prisma.blog.create({
      data: { title, content, doctorId: userId, isDraft: false },
      include: { doctor: { select: { id: true, firstName: true, lastName: true, profileImage: true } } },
    });
    return res.json({ ok: true, data: blog });
  } catch (e) {
    return next(e);
  }
}

module.exports = { getBlogs, getBlogById, createBlog };
