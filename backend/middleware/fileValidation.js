// Validate uploaded files (MIME types) and expose helper for multer fileFilter
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

function fileFilter(req, file, cb) {
  if (!file || !file.mimetype) return cb(new Error('Invalid file'));
  if (allowedImageTypes.includes(file.mimetype)) return cb(null, true);
  return cb(new Error('Unsupported file type. Allowed: jpeg, png, webp'));
}

module.exports = {
  allowedImageTypes,
  fileFilter,
};
