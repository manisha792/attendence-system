// backend/index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const { sign, verify, hashPassword, verifyPassword } = require('./auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { stringify } = require('csv-stringify/sync');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// uploads
const UPLOAD_DIR = path.join(__dirname, 'uploads');
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  // If path exists but is not a directory, replace it with a directory
  if (e && e.code === 'EEXIST') {
    try {
      const stat = fs.statSync(UPLOAD_DIR);
      if (!stat.isDirectory()) {
        fs.unlinkSync(UPLOAD_DIR);
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
    } catch (inner) {
      // If stat or unlink fails, rethrow original error
      throw e;
    }
  } else {
    throw e;
  }
}
const storage = multer.diskStorage({ destination: UPLOAD_DIR, filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname) });
const upload = multer({ storage });

// Prepared statements
const insertUser = db.prepare('INSERT INTO users (name,email,password_hash,role,class,photo_path) VALUES (?,?,?,?,?,?)');
const getUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const getUserById = db.prepare('SELECT * FROM users WHERE id = ?');
const insertDescriptor = db.prepare('INSERT INTO descriptors (user_id, descriptor_json) VALUES (?,?)');
const getDescriptors = db.prepare('SELECT d.id,d.user_id,d.descriptor_json,u.name FROM descriptors d JOIN users u ON u.id=d.user_id');
const insertAttendance = db.prepare('INSERT INTO attendance (user_id,timestamp,note,remark,remark_by) VALUES (?,?,?,?,?)');
const getAttendance = db.prepare('SELECT a.id,a.user_id,a.timestamp,a.note,a.remark,a.remark_by,u.name FROM attendance a JOIN users u ON u.id=a.user_id ORDER BY a.timestamp DESC');
const getAttendanceByUserDate = db.prepare("SELECT * FROM attendance WHERE user_id = ? AND date(timestamp) = date(?)");
const getAttendanceById = db.prepare('SELECT * FROM attendance WHERE id = ?');
const updateAttendance = db.prepare('UPDATE attendance SET timestamp = ?, note = ?, remark = ?, remark_by = ?, edited_by = ?, edited_at = ? WHERE id = ?');

// seed teacher
(function seed(){
  const teacher = getUserByEmail.get('teacher@school.local');
  if (!teacher) {
    hashPassword('teacher123').then(ph => {
      insertUser.run('Admin Teacher','teacher@school.local',ph,'teacher','class-A',null);
      console.log('Seeded teacher account: teacher@school.local / teacher123');
    });
  }
})();

// register user (student can self-register)
app.post('/api/register-user', async (req,res) => {
  const { name,email,password,role,class:klass } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'Missing fields' });
  try {
    const ph = password ? await hashPassword(password) : null;
    const info = insertUser.run(name,email||null,ph,role,klass||null,null);
    res.json({ ok:true, id: info.lastInsertRowid });
  } catch(e){ console.error(e); res.status(500).json({ error:'Could not create user' }); }
});

// upload student photo (student action) — accepts single file field 'photo'
app.post('/api/upload-photo', upload.single('photo'), (req,res) => {
  const { user_id } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try{
    const user = getUserById.get(user_id);
    if (!user) return res.status(400).json({ error: 'Unknown user' });
    // save path
    db.prepare('UPDATE users SET photo_path = ? WHERE id = ?').run(req.file.filename, user_id);
    res.json({ ok:true, path: '/uploads/' + req.file.filename, filename: req.file.filename });
  } catch(e){ console.error(e); res.status(500).json({ error:'Failed to save photo' }); }
});

// Serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

// SERVE FACE API MODELS
app.use('/models', express.static(path.join(__dirname, 'models')));

// login
app.post('/api/login', async (req,res) => {
  const { email,password } = req.body;
  const user = getUserByEmail.get(email);
  if (!user) return res.status(401).json({ error:'Invalid credentials' });
  if (user.password_hash) {
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error:'Invalid credentials' });
  }
  const token = sign({ id: user.id, role: user.role, name: user.name, class: user.class });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, class: user.class, photo_path: user.photo_path } });
});

// simple auth middleware
function authMiddleware(req,res,next){
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error:'No auth' });
  const token = auth.replace('Bearer ','');
  const payload = verify(token);
  if (!payload) return res.status(401).json({ error:'Invalid token' });
  req.user = payload;
  next();
}

// Register descriptors — teacher-only; teachers will send descriptors (computed in their browser from the student's uploaded photo)
app.post('/api/register', authMiddleware, (req,res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error:'Only teachers may register descriptors' });
  const { user_id, descriptors } = req.body; // descriptors: [number[]]
  if (!user_id || !descriptors) return res.status(400).json({ error: 'Missing fields' });
  const target = getUserById.get(user_id);
  if (!target) return res.status(400).json({ error:'Unknown user' });
  if (target.role !== 'student') return res.status(400).json({ error:'Descriptors only for students' });
  try{
    for(const d of descriptors) insertDescriptor.run(user_id, JSON.stringify(d));
    res.json({ ok:true });
  }catch(e){ console.error(e); res.status(500).json({ error:'Failed to save descriptors' }); }
});

// get labels (teachers see all; students see their own)
app.get('/api/labels', authMiddleware, (req,res) => {
  try {
    // returns rows with d.user_id, d.descriptor_json, u.name
    const rows = getDescriptors.all();
    const grouped = {};
    rows.forEach(r => {
      if (!grouped[r.user_id]) grouped[r.user_id] = { user_id: r.user_id, name: r.name, descriptors: [] };
      grouped[r.user_id].descriptors.push(JSON.parse(r.descriptor_json));
    });
    // if student request, only return theirs (for privacy)
    if (req.user.role === 'student') {
      const me = grouped[req.user.id] ? [grouped[req.user.id]] : [];
      return res.json(me);
    }
    // teacher/admin: return array of { user_id, name, descriptors }
    res.json(Object.values(grouped));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }); }
});

// attendance: one per user per calendar date
app.post('/api/attendance', authMiddleware, (req,res) => {
  const { user_id, timestamp } = req.body; // teacher or backend will call with user_id (from recognition)
  if (!user_id) return res.status(400).json({ error:'Missing user_id' });
  try{
    const ts = timestamp || new Date().toISOString();
    const existing = getAttendanceByUserDate.get(user_id, ts);
    if (existing) return res.json({ ok:true, already:true, id: existing.id });
    const info = insertAttendance.run(user_id, ts, null, null, null);
    res.json({ ok:true, id: info.lastInsertRowid });
  }catch(e){ console.error(e); res.status(500).json({ error:'Failed to record attendance' }); }
});

// student remark: one remark per attendance; no edits allowed
app.post('/api/attendance/:id/remark', authMiddleware, (req,res) => {
  const id = Number(req.params.id);
  const { remark } = req.body;
  if (!remark) return res.status(400).json({ error:'Missing remark' });
  try{
    const att = getAttendanceById.get(id);
    if (!att) return res.status(404).json({ error:'Attendance not found' });
    if (req.user.role !== 'student' || req.user.id !== att.user_id) return res.status(403).json({ error:'Forbidden' });
    // only allow if remark was empty
    if (att.remark) return res.status(400).json({ error:'Remark already exists and cannot be edited' });
    updateAttendance.run(att.timestamp, att.note, remark, req.user.id, null, null, id);
    res.json({ ok:true });
  }catch(e){ console.error(e); res.status(500).json({ error:'Failed to add remark' }); }
});

// teacher edit attendance (timestamp/note/resolve remark)
app.put('/api/attendance/:id', authMiddleware, (req,res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error:'Only teachers may edit attendance' });
  const id = Number(req.params.id);
  const { timestamp, note, remark } = req.body;
  try{
    const att = getAttendanceById.get(id);
    if (!att) return res.status(404).json({ error:'Not found' });
    const edited_at = new Date().toISOString();
    updateAttendance.run(timestamp || att.timestamp, note || att.note, remark || att.remark, att.remark_by, req.user.id, edited_at, id);
    res.json({ ok:true });
  }catch(e){ console.error(e); res.status(500).json({ error:'Failed to update' }); }
});

// list attendance; teacher can filter by class via query param ?class=CLASSNAME
app.get('/api/attendance', authMiddleware, (req,res) => {
  try{
    if (req.user.role === 'student'){
      const rows = db.prepare('SELECT a.id,a.timestamp,a.note,a.remark,a.remark_by,u.name FROM attendance a JOIN users u ON u.id=a.user_id WHERE a.user_id = ? ORDER BY a.timestamp DESC').all(req.user.id);
      return res.json(rows.map(r => ({ id:r.id, name:r.name, timestamp:r.timestamp, note:r.note, remark:r.remark, remark_by: r.remark_by })));
    }
    // teacher: optional class filter
    const klass = req.query.class;
    if (klass) {
      const rows = db.prepare('SELECT a.id,a.timestamp,a.note,a.remark,a.remark_by,u.name,u.class FROM attendance a JOIN users u ON u.id=a.user_id WHERE u.class = ? ORDER BY a.timestamp DESC').all(klass);
      return res.json(rows.map(r => ({ id:r.id, name:r.name, class: r.class, timestamp:r.timestamp, note:r.note, remark:r.remark })));
    }
    const rows = getAttendance.all();
    res.json(rows.map(r => ({ id:r.id, name:r.name, timestamp:r.timestamp, note:r.note, remark:r.remark })));
  }catch(e){ console.error(e); res.status(500).json({ error:'Failed' }); }
});

// export CSV for date (teacher)
app.get('/api/export-attendance', authMiddleware, (req,res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error:'Forbidden' });
  try{
    const date = req.query.date || new Date().toISOString().slice(0,10);
    const rows = db.prepare('SELECT a.id,a.timestamp,u.name,a.note,a.remark FROM attendance a JOIN users u ON u.id=a.user_id WHERE date(a.timestamp)=? ORDER BY a.timestamp ASC').all(date);
    const csvOut = stringify(rows.map(r=>({ id:r.id, name:r.name, timestamp:r.timestamp, note:r.note, remark:r.remark })), { header:true });
    res.setHeader('Content-Type','text/csv');
    res.send(csvOut);
  }catch(e){ console.error(e); res.status(500).json({ error:'Failed to export' }); }
});

// trigger daily export to backend/exports (teacher)
app.post('/api/trigger-daily-export', authMiddleware, (req,res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error:'Forbidden' });
  try{
    const date = new Date().toISOString().slice(0,10);
    const rows = db.prepare('SELECT a.id,a.timestamp,u.name,a.note,a.remark FROM attendance a JOIN users u ON u.id=a.user_id WHERE date(a.timestamp)=? ORDER BY a.timestamp ASC').all(date);
    const csvOut = stringify(rows.map(r=>({ id:r.id, name:r.name, timestamp:r.timestamp, note:r.note, remark:r.remark })), { header:true });
    const outDir = path.join(__dirname,'exports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    const file = path.join(outDir, `attendance-${date}.csv`);
    fs.writeFileSync(file, csvOut);
    return res.json({ ok:true, path: file });
  }catch(e){ console.error(e); res.status(500).json({ error:'Export failed' }); }
});

const PORT = process.env.PORT || 4000;
if (require.main === module) app.listen(PORT, ()=> console.log('Backend listening on', PORT));
module.exports = app;