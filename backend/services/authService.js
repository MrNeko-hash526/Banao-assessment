const bcrypt = require('bcrypt');
const prisma = require('../config/db');

async function getSignups() {
    try {
        const users = await prisma.user.findMany({ select: { id: true, firstName: true, lastName: true, email: true, username: true, userType: true, profileImage: true, addressLine1: true, city: true, state: true, pincode: true, savedAt: true } });
        return { ok: true, data: users };
    } catch (e) {
        console.error('Error fetching signups from DB:', e);
        return { ok: false, error: String(e) };
    }
}

async function saveSignup(body, file) {
    // Create user using Prisma; if DB unavailable fall back to filesystem storage
    try {
        const payload = { ...body };
        if (payload.confirmPassword) delete payload.confirmPassword;

        if (!payload.email) return { ok: false, error: 'Email is required' };
        const normalizedEmail = String(payload.email).trim().toLowerCase();
        payload.email = normalizedEmail;

        // attach uploaded file path if present (include type subfolder when provided)
        if (file && file.filename) {
            const typeFolder = (payload.type || 'profiles');
            payload.profileImage = `/uploads/${typeFolder}/${file.filename}`;
            // don't persist the transient type field
            delete payload.type;
        }

        // Hash password before storing
        if (payload.password) {
            const saltRounds = 10;
            payload.password = await bcrypt.hash(String(payload.password), saltRounds);
        }

        // Normalize enum fields to match Prisma enums
        if (payload.userType) {
            const map = { patient: 'PATIENT', doctor: 'DOCTOR' };
            const key = String(payload.userType).trim().toLowerCase();
            payload.userType = map[key] || String(payload.userType).trim().toUpperCase();
        } else {
            // default to PATIENT if not provided
            payload.userType = 'PATIENT';
        }

        // Create via Prisma
        try {
            const created = await prisma.user.create({ data: payload });
            return { ok: true, user: created };
        } catch (dbErr) {
            const msg = String(dbErr || '');
            if (msg.includes('Unique constraint') || msg.toLowerCase().includes('unique')) {
                return { ok: false, error: 'Email already registered' };
            }
            console.error('Prisma create user failed:', dbErr);
            return { ok: false, error: String(dbErr) };
        }
    } catch (e) {
        console.error('Error saving signup:', e);
        return { ok: false, error: String(e) };
    }
}

// create user (Prisma wrapper)
async function createUser(data) {
    return prisma.user.create({ data });
}

// find user by email
async function findUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
}

async function authenticateUser(email, password) {
    try {
        const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
        if (!user) return null;
        if (!user.password) return null;
        const match = await bcrypt.compare(String(password), String(user.password));
        if (!match) return null;
        return user;
    } catch (e) {
        console.error('Error authenticating user:', e);
        return null;
    }
}

module.exports = {
    getSignups,
    saveSignup,
    authenticateUser,
    createUser,
    findUserByEmail
};
