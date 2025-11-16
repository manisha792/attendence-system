// backend/db.js
const Database = require('better-sqlite3');
const db = new Database('attendance.db');

// create tables if not exist
db.prepare(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT,
  class TEXT,
  photo_path TEXT
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS descriptors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  descriptor_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  timestamp TEXT,
  note TEXT,
  remark TEXT,
  remark_by INTEGER,
  edited_by INTEGER,
  edited_at TEXT
)`).run();

console.log('DB ready');
module.exports = db;


