const express = require('express');
const authController = require('../controller/authController');
const { uploadSingle } = require('../services/upload');
const asyncHandler = require('../middleware/asyncHandler');
const { signupValidators, loginValidators, validate } = require('../middleware/validators');

const router = express.Router();

// POST /auth/signup -> uses upload middleware and save handler
router.post('/signup', uploadSingle, signupValidators, validate, asyncHandler(authController.saveSignup));

// POST /auth/login -> authenticate
router.post('/login', loginValidators, validate, asyncHandler(authController.login));

// GET /auth/signups -> public listing (kept for compatibility)
router.get('/signups', asyncHandler(authController.getSignups));

// GET /auth/me -> current user (requires Authorization header)
const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, asyncHandler(authController.me));

module.exports = router;
