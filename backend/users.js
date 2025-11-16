// backend/users.js
// New module to add user-management endpoints to the backend.
// Import and mount this from backend/index.js with: `app.use('/api/users', require('./users'))`

const express = require('express');
const db = require('./db');
const router = express.Router();

// Prepared statements
const getAllUsers = db.prepare('SELECT id,name,email,role,class,photo_path FROM users ORDER BY name ASC');
const getStudentsByClass = db.prepare('SELECT id,name,email,role,class,photo_path FROM users WHERE role = "student" AND class = ? ORDER BY name ASC');
const getUserById = db.prepare('SELECT id,name,email,role,class,photo_path FROM users WHERE id = ?');

// Middleware: simple auth helper (reuse existing auth.verify in index.js) - expects req.user populated
function ensureAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'No auth' });
    next();
}

// GET /api/users/ - teacher/admin only: list all users
router.get('/', ensureAuth, (req, res) => {
    try {
        if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
        const rows = getAllUsers.all();
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to list users' }); }
});

// GET /api/users/students?class=CLASSNAME - teacher: list students for a class
router.get('/students', ensureAuth, (req, res) => {
    try {
        if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Forbidden' });
        const klass = req.query.class;
        if (!klass) return res.status(400).json({ error: 'Missing class param' });
        const rows = getStudentsByClass.all(klass);
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

// GET /api/users/:id - get a single user (teacher or owner)
router.get('/:id', ensureAuth, (req, res) => {
    try {
        const id = Number(req.params.id);
        const row = getUserById.get(id);
        if (!row) return res.status(404).json({ error: 'Not found' });
        if (req.user.role !== 'teacher' && req.user.id !== id) return res.status(403).json({ error: 'Forbidden' });
        res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
