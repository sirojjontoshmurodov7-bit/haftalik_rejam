// Eski SQLite (data/rejam.db) ma'lumotlarini hozirgi bazaga ko'chiradi. Ishga tushirish:
//   node --experimental-sqlite scripts/migrate-from-sqlite.js [./data/rejam.db]
import { DatabaseSync } from 'node:sqlite';
import { openDb, pgClient } from '../src/db.js';

const src = new DatabaseSync(process.argv[2] || './data/rejam.db', { readOnly: true });
const db = await openDb(await pgClient(process.env.DATABASE_URL));
const c = db.client;
let n = { users: 0, tasks: 0, logs: 0 };
for (const u of src.prepare('SELECT * FROM users').all()) {
  await c.query(`INSERT INTO users (id,chat_id,code,secret,tz) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`, [u.id, u.chat_id, u.code, u.secret, u.tz]);
  n.users++;
}
await c.query(`SELECT setval(pg_get_serial_sequence('users','id'), GREATEST((SELECT COALESCE(MAX(id),1) FROM users),1))`);
for (const t of src.prepare('SELECT * FROM tasks').all()) {
  await c.query(`INSERT INTO tasks (uid,id,title,start_time,end_time,repeat,date,days) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`, [t.uid, t.id, t.title, t.start, t.end, t.repeat, t.date, t.days]);
  n.tasks++;
}
for (const l of src.prepare('SELECT * FROM logs').all()) {
  await c.query(`INSERT INTO logs (uid,task_id,date,status,source,ts) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`, [l.uid, l.task_id, l.date, l.status, l.source, l.ts]);
  n.logs++;
}
console.log('Ko\'chirildi:', n);
await db.close();
