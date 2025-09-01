const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// multer for file uploads
const multer = require('multer');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadsDir),
	filename: (req, file, cb) => {
		const ext = (file.originalname || '').split('.').pop();
		const name = `p-${Date.now()}.${ext || 'png'}`;
		cb(null, name);
	},
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB limit

// serve uploaded files
app.use('/uploads', express.static(uploadsDir));

const storageDir = path.join(__dirname);
const storageFile = path.join(storageDir, 'signups.json');

// Ensure storage file exists and is a JSON array
function ensureStorage() {
	if (!fs.existsSync(storageFile)) {
		try {
			fs.writeFileSync(storageFile, '[]', { encoding: 'utf8' });
			console.log('Created storage file:', storageFile);
		} catch (e) {
			console.error('Failed to create storage file:', e);
			throw e;
		}
	}
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/signups', (req, res) => {
	try {
		ensureStorage();
		const raw = fs.readFileSync(storageFile, 'utf8');
		let arr = [];
		try {
			arr = JSON.parse(raw) || [];
		} catch (e) {
			arr = [];
		}
		return res.json({ ok: true, data: arr });
	} catch (e) {
		console.error('Error reading signups:', e);
		return res.status(500).json({ ok: false, error: String(e) });
	}
});

app.post('/save-signup', upload.single('profileImage'), (req, res) => {
		try {
			ensureStorage();

			// form fields will be in req.body (strings), file in req.file
			// debug log
			console.log('POST /save-signup body keys:', Object.keys(req.body));
			if (req.file) console.log('POST /save-signup file:', req.file.filename, req.file.size);
		const body = req.body || {};
		const payload = { ...body };
		// Basic sanitization: remove confirmPassword before storing
		if (payload.confirmPassword) delete payload.confirmPassword;

		// If a file was uploaded, attach its public path
		if (req.file && req.file.filename) {
			payload.profileImage = `/uploads/${req.file.filename}`;
		}

		// Normalize and validate email
		if (!payload.email) {
			return res.status(400).json({ ok: false, error: 'Email is required' });
		}
		const normalizedEmail = String(payload.email).trim().toLowerCase();
		payload.email = normalizedEmail;
		payload.savedAt = new Date().toISOString();

		const raw = fs.readFileSync(storageFile, 'utf8');
		let arr = [];
		try {
			arr = JSON.parse(raw) || [];
		} catch (e) {
			arr = [];
		}

		// check for duplicate email (normalized)
		const exists = arr.some((u) => typeof u.email === 'string' && String(u.email).trim().toLowerCase() === normalizedEmail);
		if (exists) {
			// if we saved a file but email exists, optionally remove the file to avoid orphan
			if (req.file && req.file.path) {
				try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
			}
			return res.status(409).json({ ok: false, error: 'Email already registered' });
		}

		arr.push(payload);
		fs.writeFileSync(storageFile, JSON.stringify(arr, null, 2), 'utf8');

		return res.json({ ok: true, count: arr.length });
	} catch (e) {
		console.error('Error saving signup:', e);
		return res.status(500).json({ ok: false, error: String(e) });
	}
});

app.listen(PORT, () => {
	console.log(`Backend index listening on http://localhost:${PORT}`);
	try {
		ensureStorage();
	} catch (e) {
		console.error('Storage initialization failed');
	}
});

