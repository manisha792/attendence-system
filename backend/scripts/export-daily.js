// backend/scripts/export-daily.js
const db = require('../db');
const { stringify } = require('csv-stringify/sync');
const fs = require('fs');
const path = require('path');

const date = process.argv[2] || new Date().toISOString().slice(0,10);
const rows = db.prepare('SELECT a.id,a.timestamp,u.name,a.note,a.remark FROM attendance a JOIN users u ON u.id=a.user_id WHERE date(a.timestamp)=? ORDER BY a.timestamp ASC').all(date);
const csvOut = stringify(rows.map(r=>({ id:r.id, name:r.name, timestamp:r.timestamp, note:r.note, remark:r.remark })), { header:true });
const outDir = path.join(__dirname,'..','exports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
const file = path.join(outDir, `attendance-${date}.csv`);
fs.writeFileSync(file, csvOut);
console.log('Exported to', file);