const express = require('express');
const { uploadSingle } = require('../services/upload');
const uploadController = require('../controller/uploadController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

// POST /upload/ -> single file upload (field name: profileImage)
// FormData fields: profileImage=file, type='profiles'|'blogs', userId or blogId to persist URL
router.post('/', uploadSingle, asyncHandler(uploadController.handleUpload));

module.exports = router;
