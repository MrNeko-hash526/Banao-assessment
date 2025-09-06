const express = require('express');
const router = express.Router();
const blogController = require('../controller/blogController');
const authMiddleware = require('../middleware/auth');

router.get('/', blogController.getBlogs);
router.get('/:id', blogController.getBlogById);
router.post('/', authMiddleware, blogController.createBlog);

module.exports = router;
