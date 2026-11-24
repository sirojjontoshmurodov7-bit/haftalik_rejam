import { randomBytes, randomInt } from 'node:crypto';

// Ikkita "client" qo'llab-quvvatlanadi, ikkalasi ham { query(sql, params) -> rows, transaction(fn) }:
//   pgClient(url)      - ishlab chiqarish (Neon / har qanday PostgreSQL)
//   pgliteClient(db)   - testlar (xotiradagi PostgreSQL)

export async function pgClient(url) {
  const { default: pg } = await import('pg');
  pg.types.setTypeParser(20, (v) => Number(v)); // bigint -> number
  const pool = new pg.Pool({ connectionString: url, max: 5, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: true } });
  return {
    query: async (sql, params = []) => (await pool.query(sql, params)).rows,
    exec: (sql) => pool.query(sql),
    async transaction(fn) {
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        const r = await fn({ query: async (s, p = []) => (await c.query(s, p)).rows });
        await c.query('COMMIT');
        return r;
      } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; } finally { c.release(); }
    },
    close: () => pool.end(),
  };
}

export function pgliteClient(pglite) {
  return {
    query: async (sql, params = []) => (await pglite.query(sql, params)).rows,
    exec: (sql) => pglite.exec(sql),
    transaction: (fn) => pglite.transaction((tx) => fn({ query: async (s, p = []) => (await tx.query(s, p)).rows })),
    close: () => pglite.close(),
  };
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT UNIQUE,
  code TEXT UNIQUE,
  secret TEXT NOT NULL,
  tz TEXT NOT NULL DEFAULT 'Asia/Tashkent'
);
CREATE TABLE IF NOT EXISTS tasks (
  uid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  repeat TEXT NOT NULL DEFAULT 'once',
  date TEXT,
  days TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (uid, id)
);
CREATE TABLE IF NOT EXISTS sent (
  uid INTEGER NOT NULL, task_id TEXT NOT NULL, date TEXT NOT NULL, kind TEXT NOT NULL,
  PRIMARY KEY (uid, task_id, date, kind)
);
CREATE TABLE IF NOT EXISTS logs (
  uid INTEGER NOT NULL, task_id TEXT NOT NULL, date TEXT NOT NULL,
  status TEXT NOT NULL, source TEXT NOT NULL, ts BIGINT NOT NULL,
  PRIMARY KEY (uid, task_id, date)
);
`;

const toUser = (r) => (r ? { ...r, id: Number(r.id), chat_id: r.chat_id == null ? null : Number(r.chat_id) } : null);
const toTask = (r) => ({ id: r.id, title: r.title, start: r.start_time, end: r.end_time, repeat: r.repeat, date: r.date, days: JSON.parse(r.days) });

const UPSERT_TASK = `INSERT INTO tasks (uid,id,title,start_time,end_time,repeat,date,days) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
  ON CONFLICT (uid,id) DO UPDATE SET title=EXCLUDED.title,start_time=EXCLUDED.start_time,end_time=EXCLUDED.end_time,repeat=EXCLUDED.repeat,date=EXCLUDED.date,days=EXCLUDED.days`;
const taskParams = (uid, t) => [uid, String(t.id), t.title, t.start, t.end, t.repeat || 'once', t.date ?? null, JSON.stringify(t.days || [])];

export async function openDb(client) {
  await client.exec(SCHEMA);

  const newCode = async () => {
    for (;;) {
      const c = String(randomInt(100000, 999999));
      if (!(await client.query('SELECT 1 FROM users WHERE code=$1', [c])).length) return c;
    }
  };

  return {
    client,
    async userForChat(chatId, tz) {
      const found = await client.query('SELECT * FROM users WHERE chat_id=$1', [chatId]);
      if (found.length) return toUser(found[0]);
      const code = await newCode();
      const ins = await client.query(
        'INSERT INTO users (chat_id, code, secret, tz) VALUES ($1,$2,$3,$4) ON CONFLICT (chat_id) DO UPDATE SET chat_id=EXCLUDED.chat_id RETURNING *',
        [chatId, code, randomBytes(16).toString('hex'), tz],
      );
      return toUser(ins[0]);
    },
    async userById(id) { return toUser((await client.query('SELECT * FROM users WHERE id=$1', [id]))[0]); },
    async userByCode(code) { return toUser((await client.query('SELECT * FROM users WHERE code=$1', [String(code)]))[0]); },
    async linkedUsers() { return (await client.query('SELECT * FROM users WHERE chat_id IS NOT NULL')).map(toUser); },
    async getTasks(uid) { return (await client.query('SELECT * FROM tasks WHERE uid=$1 ORDER BY start_time', [uid])).map(toTask); },
    replaceTasks(uid, tasks) {
      return client.transaction(async (tx) => {
        await tx.query('DELETE FROM tasks WHERE uid=$1', [uid]);
        for (const t of tasks) await tx.query(UPSERT_TASK, taskParams(uid, t));
      });
    },
    addTask: (uid, t) => client.query(UPSERT_TASK, taskParams(uid, t)),
    removeTask: (uid, id) => client.query('DELETE FROM tasks WHERE uid=$1 AND id=$2', [uid, String(id)]),
    async sentSet(uid, date) {
      const rows = await client.query('SELECT task_id, date, kind FROM sent WHERE uid=$1 AND date=$2', [uid, date]);
      return new Set(rows.map((r) => `${r.task_id}|${r.date}|${r.kind}`));
    },
    async answeredSet(uid, date) {
      const rows = await client.query('SELECT task_id FROM logs WHERE uid=$1 AND date=$2', [uid, date]);
      return new Set(rows.map((r) => `${r.task_id}|${date}`));
    },
    markSent: (uid, taskId, date, kind) => client.query('INSERT INTO sent (uid,task_id,date,kind) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [uid, String(taskId), date, kind]),
    putLog: (uid, taskId, date, status, source) => client.query(
      `INSERT INTO logs (uid,task_id,date,status,source,ts) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (uid,task_id,date) DO UPDATE SET status=EXCLUDED.status, source=EXCLUDED.source, ts=EXCLUDED.ts`,
      [uid, String(taskId), date, status, source, Date.now()],
    ),
    async logsSince(uid, since) {
      return (await client.query('SELECT task_id, date, status, source, ts FROM logs WHERE uid=$1 AND date>=$2 ORDER BY date', [uid, since])).map((r) => ({ ...r, ts: Number(r.ts) }));
    },
    close: () => client.close?.(),
  };
}
