import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { localParts } from './schedule.js';

const STATUSES = new Set(['done', 'missed', 'later']);
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function json(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > 256 * 1024) throw new Error('too_large');
    chunks.push(c);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

export function validTask(t) {
  return t && typeof t.id !== 'undefined' && typeof t.title === 'string' && t.title.length > 0 && t.title.length <= 200
    && HHMM.test(t.start) && HHMM.test(t.end) && t.start < t.end
    && ['once', 'daily', 'days'].includes(t.repeat || 'once');
}

async function authed(db, req) {
  const uid = Number(req.headers['x-user-id']);
  const secret = String(req.headers['x-secret'] || '');
  const u = Number.isInteger(uid) ? await db.userById(uid) : null;
  if (!u) return null;
  const a = Buffer.from(u.secret);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b) ? u : null;
}

export function createApi(db, { onAnswer } = {}) {
  return createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') return json(res, 204, {});
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/health') return json(res, 200, { ok: true });

      if (url.pathname === '/api/login' && req.method === 'POST') {
        const { code } = await readJson(req);
        const u = await db.userByCode(code);
        if (!u) return json(res, 404, { error: 'kod_topilmadi' });
        return json(res, 200, { userId: u.id, secret: u.secret, tz: u.tz });
      }

      const u = await authed(db, req);
      if (!u) return json(res, 401, { error: 'ruxsat_yoq' });

      if (url.pathname === '/api/state' && req.method === 'GET') {
        const since = localParts(new Date(Date.now() - 30 * 864e5), u.tz).date;
        return json(res, 200, { tasks: await db.getTasks(u.id), logs: await db.logsSince(u.id, since), tz: u.tz });
      }
      if (url.pathname === '/api/tasks' && req.method === 'PUT') {
        const { tasks } = await readJson(req);
        if (!Array.isArray(tasks) || tasks.length > 500 || !tasks.every(validTask)) return json(res, 400, { error: 'notogri_vazifa' });
        await db.replaceTasks(u.id, tasks);
        return json(res, 200, { ok: true, count: tasks.length });
      }
      if (url.pathname === '/api/answer' && req.method === 'POST') {
        const { taskId, date, status } = await readJson(req);
        if (!STATUSES.has(status) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || taskId == null) return json(res, 400, { error: 'notogri_javob' });
        if (status !== 'later') await db.putLog(u.id, taskId, date, status, 'app');
        onAnswer?.(u, taskId, date, status);
        return json(res, 200, { ok: true });
      }
      return json(res, 404, { error: 'yoq' });
    } catch (e) {
      return json(res, e.message === 'too_large' ? 413 : 400, { error: 'xato', detail: String(e.message) });
    }
  });
}
