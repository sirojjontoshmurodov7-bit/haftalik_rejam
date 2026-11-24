import { loadSession, loadPending, savePending, loadOps, saveOps } from './storage';

async function call(session, path, method = 'GET', body) {
  const res = await fetch(`${session.apiUrl}${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-user-id': String(session.userId), 'x-secret': session.secret },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const e = new Error(res.status === 401 ? 'Sessiya yaroqsiz, qayta ulaning' : `HTTP ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

export async function login(apiUrl, code) {
  const url = apiUrl.replace(/\/+$/, '');
  const res = await fetch(`${url}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
  if (!res.ok) throw new Error(res.status === 404 ? 'Kod noto\'g\'ri' : `Server xatosi (${res.status})`);
  const j = await res.json();
  return { apiUrl: url, userId: j.userId, secret: j.secret };
}

// Vazifa amallari navbatga qo'yiladi va bittadan yuboriladi: shu tufayli bot yoki sayt qo'shgan vazifalar o'chib ketmaydi.
export async function queueTaskOp(op) {
  const ops = await loadOps();
  ops.push(op);
  await saveOps(ops);
  await flushOps();
}

export async function flushOps() {
  const s = await loadSession();
  if (!s) return;
  const ops = await loadOps();
  const left = [];
  for (const o of ops) {
    try {
      if (o.op === 'add') await call(s, '/api/tasks', 'POST', { task: o.task });
      else await call(s, `/api/tasks/${encodeURIComponent(o.id)}`, 'DELETE');
    } catch (e) { if (e.status !== 400) left.push(o); } // 400: yaroqsiz amal abadiy qolib ketmasin
  }
  await saveOps(left);
}

// Ulanganda mahalliy vazifalarni serverga qo'shadi (mavjudlari yangilanadi, boshqalari o'chmaydi).
export async function pushAllLocal(tasks) {
  for (const t of tasks) await queueTaskOp({ op: 'add', task: t });
}

export async function syncNow() {
  await flushOps();
  await flushPending();
}

export async function pullState() {
  const s = await loadSession();
  if (!s) return null;
  return call(s, '/api/state');
}

// Javobni yuboradi; tarmoq xatosida navbatga qo'yadi va keyin qayta uradi.
export async function sendAnswer(taskId, date, status) {
  const s = await loadSession();
  if (!s) return;
  const pending = await loadPending();
  pending.push({ taskId, date, status });
  await savePending(pending);
  await flushPending();
}

export async function flushPending() {
  const s = await loadSession();
  if (!s) return;
  const pending = await loadPending();
  const left = [];
  for (const p of pending) {
    try { await call(s, '/api/answer', 'POST', p); } catch (e) { if (e.status !== 400) left.push(p); }
  }
  await savePending(left);
}
