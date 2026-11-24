import { dueEvents } from './schedule.js';

export function messageFor(ev) {
  const { task, kind } = ev;
  const t = `${task.start}-${task.end}`;
  if (kind === 'remind') return `⏰ 15 daqiqadan keyin: <b>${esc(task.title)}</b>\n🕒 ${t}`;
  if (kind === 'ask') return `✅ <b>${esc(task.title)}</b> vaqti tugadi (${t}).\nBajardingizmi?`;
  return `🔔 Eslatma: <b>${esc(task.title)}</b> bajarildimi?`;
}

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function keyboardFor(ev) {
  if (ev.kind === 'remind') return null;
  const base = `a:${ev.task.id}:${ev.date}`;
  return [[
    { text: '✅ Ha', callback_data: `${base}:done` },
    { text: '❌ Yo\'q', callback_data: `${base}:missed` },
    { text: '⏳ Keyinroq', callback_data: `${base}:later` },
  ]];
}

// Har daqiqada chaqiriladi. send(chatId, text, keyboard) -> Promise
export async function tick(db, now, send) {
  let count = 0;
  for (const u of await db.linkedUsers()) {
    const tasks = await db.getTasks(u.id);
    if (!tasks.length) continue;
    // Kechayu bugun chegarasida xato bo'lmasligi uchun foydalanuvchi sanasini olamiz
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: u.tz }).format(now);
    const events = dueEvents(tasks, now, u.tz, await db.sentSet(u.id, date), await db.answeredSet(u.id, date));
    for (const ev of events) {
      try {
        await send(u.chat_id, messageFor(ev), keyboardFor(ev));
        await db.markSent(u.id, ev.task.id, ev.date, ev.kind);
        count++;
      } catch (e) {
        console.error('yuborib bo\'lmadi', u.id, ev.task.id, e.message); // keyingi tickda qayta uriniladi
      }
    }
  }
  return count;
}
