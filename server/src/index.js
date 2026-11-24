import { openDb, pgClient, pgliteClient } from './db.js';
import { createApi } from './api.js';
import { createBot } from './bot.js';
import { tick } from './scheduler.js';
import { localParts, weeklyStats, streak } from './schedule.js';

const token = process.env.BOT_TOKEN;
const port = Number(process.env.PORT || 3000);
const tz = process.env.TZ_DEFAULT || 'Asia/Tashkent';

async function makeClient() {
  if (process.env.DATABASE_URL) return pgClient(process.env.DATABASE_URL);
  console.warn('DATABASE_URL yo\'q: mahalliy PostgreSQL (PGlite, ./data/pglite) ishlatiladi. Hosting uchun DATABASE_URL bering.');
  const { PGlite } = await import('@electric-sql/pglite');
  return pgliteClient(new PGlite('./data/pglite'));
}

const db = await openDb(await makeClient());
createApi(db).listen(port, '0.0.0.0', () => console.log(`API tayyor: :${port}`));

if (!token) {
  console.warn('BOT_TOKEN yo\'q: faqat API ishlayapti, bot va eslatmalar o\'chiq.');
} else {
  const bot = createBot(token, db, tz);
  const send = (chatId, text, kb) =>
    bot.api.sendMessage(chatId, text, { parse_mode: 'HTML', reply_markup: kb ? { inline_keyboard: kb } : undefined });
  let busy = false;
  setInterval(async () => {
    if (busy) return; // oldingi tick tugamagan bo'lsa, ustma-ust tushmasin
    busy = true;
    try { await tick(db, new Date(), send); } catch (e) { console.error('tick xatosi', e.message); } finally { busy = false; }
  }, 30_000);
  // Yakshanba 20:00 da haftalik hisobot (har foydalanuvchiga kuniga bir marta)
  const reported = new Set();
  setInterval(async () => {
    try {
      for (const u of await db.linkedUsers()) {
        const { date, weekday, minutes } = localParts(new Date(), u.tz);
        const key = `${u.id}|${date}`;
        if (weekday !== 0 || minutes < 20 * 60 || minutes >= 21 * 60 || reported.has(key)) continue;
        reported.add(key);
        const logs = await db.logsSince(u.id, localParts(new Date(Date.now() - 6 * 864e5), u.tz).date);
        const s = weeklyStats(logs);
        const byDay = {};
        for (const l of logs) byDay[l.date] = (byDay[l.date] ?? true) && l.status === 'done';
        await send(u.chat_id, `📊 Haftalik hisobot\nBajarildi: ${s.done}/${s.total} (${s.percent}%)\n🔥 Ketma-ket yaxshi kunlar: ${streak(byDay)}`);
      }
    } catch (e) { console.error('hisobot xatosi', e.message); }
  }, 60_000);
  bot.start({ onStart: (i) => console.log(`Bot ishga tushdi: @${i.username}`) });
}
