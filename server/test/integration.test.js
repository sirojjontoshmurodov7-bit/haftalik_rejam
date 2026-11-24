import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { openDb, pgliteClient } from '../src/db.js';
import { createApi } from '../src/api.js';
import { tick } from '../src/scheduler.js';

async function setup() {
  const db = await openDb(pgliteClient(new PGlite()));
  const user = await db.userForChat(111, 'Asia/Tashkent');
  const server = createApi(db);
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const login = await (await fetch(`${base}/api/login`, { method: 'POST', body: JSON.stringify({ code: user.code }) })).json();
  const h = { 'x-user-id': String(login.userId), 'x-secret': login.secret, 'content-type': 'application/json' };
  return { db, user, server, base, h };
}

test('userForChat bir xil chat uchun bir xil foydalanuvchi qaytaradi', async () => {
  const { db, user, server } = await setup();
  const again = await db.userForChat(111, 'Asia/Tashkent');
  assert.equal(again.id, user.id);
  assert.equal(typeof again.chat_id, 'number');
  server.close();
});

test('login noto\'g\'ri kod bilan 404, autentifikatsiyasiz 401', async () => {
  const { server, base } = await setup();
  assert.equal((await fetch(`${base}/api/login`, { method: 'POST', body: JSON.stringify({ code: '000000' }) })).status, 404);
  assert.equal((await fetch(`${base}/api/state`)).status, 401);
  server.close();
});

test('noto\'g\'ri secret rad etiladi', async () => {
  const { server, base, h } = await setup();
  const r = await fetch(`${base}/api/state`, { headers: { ...h, 'x-secret': 'xato' } });
  assert.equal(r.status, 401);
  server.close();
});

test('vazifalar sinxronlanadi va noto\'g\'ri vazifa rad etiladi', async () => {
  const { server, base, h, db, user } = await setup();
  const ok = await fetch(`${base}/api/tasks`, { method: 'PUT', headers: h, body: JSON.stringify({ tasks: [{ id: 'a', title: 'Sport', start: '10:00', end: '11:00', repeat: 'daily' }] }) });
  assert.equal(ok.status, 200);
  assert.equal((await db.getTasks(user.id)).length, 1);
  const bad = await fetch(`${base}/api/tasks`, { method: 'PUT', headers: h, body: JSON.stringify({ tasks: [{ id: 'b', title: 'X', start: '11:00', end: '10:00' }] }) });
  assert.equal(bad.status, 400);
  assert.equal((await db.getTasks(user.id)).length, 1, 'xato so\'rov mavjud vazifalarni buzmasligi kerak');
  const st = await (await fetch(`${base}/api/state`, { headers: h })).json();
  assert.equal(st.tasks[0].title, 'Sport');
  server.close();
});

test('replaceTasks xato bo\'lsa tranzaksiya orqaga qaytadi', async () => {
  const { db, user, server } = await setup();
  await db.addTask(user.id, { id: 'keep', title: 'Qoladi', start: '08:00', end: '09:00', repeat: 'daily' });
  await assert.rejects(db.replaceTasks(user.id, [{ id: 'n1', title: 'Yangi', start: '10:00', end: '11:00' }, { id: 'n2', title: null, start: '10:00', end: '11:00' }]));
  assert.deepEqual((await db.getTasks(user.id)).map((t) => t.id), ['keep']);
  server.close();
});

test('tick: eslatma, so\'rov, javobdan keyin jim', async () => {
  const { server, db, user, base, h } = await setup();
  await db.addTask(user.id, { id: 't1', title: 'Sport', start: '10:00', end: '11:00', repeat: 'daily' });
  const sent = [];
  const send = async (chat, text, kb) => sent.push({ chat, text, kb });
  const at = (hhmm) => new Date(`2026-11-24T${hhmm}:00+05:00`);

  assert.equal(await tick(db, at('09:46'), send), 1);
  assert.match(sent[0].text, /15 daqiqadan keyin/);
  assert.equal(sent[0].chat, 111);
  assert.equal(await tick(db, at('09:47'), send), 0, 'qayta yuborilmasligi kerak');

  assert.equal(await tick(db, at('11:00'), send), 1);
  assert.match(sent[1].text, /Bajardingizmi/);
  assert.equal(sent[1].kb[0].length, 3);

  await fetch(`${base}/api/answer`, { method: 'POST', headers: h, body: JSON.stringify({ taskId: 't1', date: '2026-11-24', status: 'done' }) });
  assert.equal(await tick(db, at('11:06'), send), 0);
  const logs = await db.logsSince(user.id, '2026-11-24');
  assert.equal(logs[0].status, 'done');
  assert.equal(logs[0].source, 'app');
  server.close();
});

test('yuborish xatosida belgilanmaydi (qayta uriniladi)', async () => {
  const { server, db, user } = await setup();
  await db.addTask(user.id, { id: 't2', title: 'Kitob', start: '10:00', end: '11:00', repeat: 'daily' });
  const at = new Date('2026-11-24T09:50:00+05:00');
  await tick(db, at, async () => { throw new Error('tarmoq'); });
  assert.equal(await tick(db, at, async () => {}), 1);
  server.close();
});
