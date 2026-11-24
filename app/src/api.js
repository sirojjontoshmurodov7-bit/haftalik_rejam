import { loadSession, loadPending, savePending } from './storage';

async function call(session, path, method = 'GET', body) {
  const res = await fetch(`${session.apiUrl}${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-user-id': String(session.userId), 'x-secret': session.secret },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function login(apiUrl, code) {
  const url = apiUrl.replace(/\/+$/, '');
  const res = await fetch(`${url}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
  if (!res.ok) throw new Error(res.status === 404 ? 'Kod noto\'g\'ri' : `Server xatosi (${res.status})`);
  const j = await res.json();
  return { apiUrl: url, userId: j.userId, secret: j.secret };
}

export async function pushTasks(tasks) {
  const s = await loadSession();
  if (!s) return false;
  await call(s, '/api/tasks', 'PUT', { tasks });
  return true;
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
    try { await call(s, '/api/answer', 'POST', p); } catch { left.push(p); }
  }
  await savePending(left);
}
