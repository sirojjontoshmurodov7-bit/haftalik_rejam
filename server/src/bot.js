import { Bot } from 'grammy';
import { parseQuickAdd, weeklyStats, streak, localParts, isActiveOn } from './schedule.js';
import { esc } from './scheduler.js';
import { randomUUID } from 'node:crypto';

export function createBot(token, db, tzDefault) {
  const bot = new Bot(token);
  const me = (ctx) => db.userForChat(ctx.chat.id, tzDefault);

  bot.command('start', async (ctx) => {
    const u = await me(ctx);
    await ctx.reply(
      `Salom! Men <b>Haftalik rejam</b> botiman.\n\n` +
      `➕ Vazifa qo'shish: <code>09:00-10:30 Sport</code>\n` +
      `🔁 Har kuni: <code>07:00-07:30 har kuni Mashq</code>\n` +
      `📅 /bugun: bugungi rejalar\n📊 /hafta: haftalik natija\n🗑 /ochir 2: raqami bo'yicha o'chirish\n\n` +
      `📱 Ilovaga ulash kodi: <code>${u.code}</code>`,
      { parse_mode: 'HTML' },
    );
  });

  bot.command('bugun', async (ctx) => {
    const u = await me(ctx);
    const { date, weekday } = localParts(new Date(), u.tz);
    const tasks = (await db.getTasks(u.id)).filter((t) => isActiveOn(t, date, weekday));
    if (!tasks.length) return ctx.reply('Bugun reja yo\'q. Qo\'shish uchun: 09:00-10:00 Nomi');
    const done = new Map((await db.logsSince(u.id, date)).filter((l) => l.date === date).map((l) => [l.task_id, l.status]));
    const mark = { done: '✅', missed: '❌' };
    const lines = tasks.map((t, i) => `${i + 1}. ${mark[done.get(String(t.id))] || '▫️'} ${t.start}-${t.end} ${esc(t.title)}`);
    await ctx.reply(lines.join('\n'));
  });

  bot.command('hafta', async (ctx) => {
    const u = await me(ctx);
    const since = localParts(new Date(Date.now() - 6 * 864e5), u.tz).date;
    const logs = await db.logsSince(u.id, since);
    const s = weeklyStats(logs);
    const byDay = {};
    for (const l of logs) byDay[l.date] = (byDay[l.date] ?? true) && l.status === 'done';
    const st = streak(byDay);
    await ctx.reply(`📊 Oxirgi 7 kun\nBajarildi: ${s.done}/${s.total} (${s.percent}%)\n🔥 Ketma-ket yaxshi kunlar: ${st}`);
  });

  bot.command('ochir', async (ctx) => {
    const u = await me(ctx);
    const n = Number(ctx.match);
    const { date, weekday } = localParts(new Date(), u.tz);
    const list = (await db.getTasks(u.id)).filter((t) => isActiveOn(t, date, weekday));
    const t = list[n - 1];
    if (!t) return ctx.reply('Bunday raqam yo\'q. Avval /bugun ni ko\'ring.');
    await db.removeTask(u.id, t.id);
    await ctx.reply(`🗑 O'chirildi: ${t.title}`);
  });

  bot.on('callback_query:data', async (ctx) => {
    const [kind, taskId, date, status] = ctx.callbackQuery.data.split(':');
    if (kind !== 'a' || !['done', 'missed', 'later'].includes(status)) return ctx.answerCallbackQuery();
    const u = await me(ctx);
    if (status !== 'later') await db.putLog(u.id, taskId, date, status, 'bot');
    const label = { done: '✅ Bajarildi, barakalla!', missed: '❌ Bajarilmadi. Ertaga yaxshiroq!', later: '⏳ Keyinroq eslataman' }[status];
    await ctx.answerCallbackQuery({ text: label });
    await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } }).catch(() => {});
    await ctx.reply(label);
  });

  bot.on('message:text', async (ctx) => {
    const u = await me(ctx);
    const p = parseQuickAdd(ctx.message.text);
    if (!p) return ctx.reply('Tushunmadim. Namuna: <code>09:00-10:30 Sport</code> yoki <code>07:00-07:30 har kuni Mashq</code>', { parse_mode: 'HTML' });
    const date = localParts(new Date(), u.tz).date;
    await db.addTask(u.id, { id: randomUUID(), title: p.title, start: p.start, end: p.end, repeat: p.repeat, date: p.repeat === 'once' ? date : null });
    await ctx.reply(`➕ Qo'shildi: ${p.start}-${p.end} ${p.title}${p.repeat === 'daily' ? ' (har kuni)' : ' (bugun)'}`);
  });

  bot.catch((e) => console.error('bot xatosi', e.message));
  return bot;
}
