const express = require('express');
const path = require('path');
const cors = require('cors');
const authService = require('./services/authService');
const { uploadSingle, serveUploads } = require('./services/upload');
require('dotenv').config();
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

// initialize prisma client (singleton) so it's available app-wide
const prisma = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
// configure helmet but allow cross-origin resource loading for static assets
app.use(helmet({
	crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 200 });
app.use(limiter);

// serve uploaded files
app.use('/uploads', serveUploads);


app.get('/health', (req, res) => res.json({ ok: true }));

// compatibility redirect: /signups -> /auth/signups
app.get('/signups', (req, res) => res.redirect(302, '/auth/signups'));

// DB health check
app.get('/health/db', async (req, res, next) => {
	try {
		// simple lightweight query
		await prisma.$queryRaw`SELECT 1`;
		return res.json({ ok: true, db: 'reachable' });
	} catch (e) {
		// forward to error handler
		e.status = 500;
		return next(e);
	}
});

// auth routes (signup, login, signups)
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// upload routes
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/upload', uploadRoutes);

// blog routes
const blogRoutes = require('./routes/blogRoutes');
app.use('/blogs', blogRoutes);


// attach to app.locals for convenient access in middleware/controllers/services
app.locals.prisma = prisma;

// global error handler (should be after routes)
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`Backend index listening on http://localhost:${PORT}`);
});

