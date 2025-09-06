const multer = require('multer');
const path = require('path');
const fs = require('fs');
const express = require('express');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // determine subfolder: 'profiles' or 'blogs' (default profiles)
        const type = (req.body && req.body.type) || (req.query && req.query.type) || 'profiles';
        const dir = path.join(uploadsDir, type);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = (file.originalname || '').split('.').pop();
        const random = require('crypto').randomBytes(6).toString('hex');
        const name = `${Date.now()}-${random}.${ext || 'png'}`;
        cb(null, name);
    },
});

const { fileFilter } = require('../middleware/fileValidation');

// dynamic limits: profiles 2MB, blogs 8MB
const upload = multer({ storage, fileFilter, limits: { fileSize: 8 * 1024 * 1024 } });

// Middleware for single file upload
const uploadSingle = (req, res, next) => {
    // if type is profiles, enforce 2MB
    const type = (req.body && req.body.type) || (req.query && req.query.type) || 'profiles';
    if (type === 'profiles') {
        return multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }).single('profileImage')(req, res, next);
    }
    // default (blogs) up to 8MB
    return upload.single('profileImage')(req, res, next);
};

// Static file serving middleware
const serveUploads = express.static(uploadsDir);

module.exports = {
    uploadSingle,
    serveUploads,
    uploadsDir
};
