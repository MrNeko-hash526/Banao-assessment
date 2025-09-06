const express = require('express');
const router = express.Router();
const blogController = require('../controller/blogController');
const authMiddleware = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

// public list
router.get('/', blogController.getBlogs);

// doctor-only: get current doctor's blogs
router.get('/mine', authMiddleware, blogController.getMyBlogs);

// debug: latest blog for current doctor
router.get('/debug/latest', authMiddleware, blogController.getLatestBlogForDoctor);

// note: place /mine before /:id so the literal path isn't shadowed by the param route
router.get('/:id', optionalAuth, blogController.getBlogById);

// create requires authentication (doctor check is performed in controller)
router.post('/', authMiddleware, blogController.createBlog);

// update & delete require authentication and ownership (controller enforces)
router.put('/:id', authMiddleware, blogController.updateBlog);
router.delete('/:id', authMiddleware, blogController.deleteBlog);

module.exports = router;
