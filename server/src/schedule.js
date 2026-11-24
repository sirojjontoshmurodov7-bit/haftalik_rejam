// Sof mantiq: qaysi vazifaga hozir qanday xabar yuborish kerak.
// Vaqt kiritishi: "now" = Date, tz = IANA zona (masalan Asia/Tashkent).

export const REMIND_BEFORE_MIN = 15;
export const FOLLOWUP_AFTER_MIN = 5;

export function localParts(now, tz) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  const hour = p.hour === '24' ? 0 : Number(p.hour);
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: hour * 60 + Number(p.minute), weekday: wd };
}

export function toMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// task: {id,title,start,end,repeat:'daily'|'once'|'days',date,days:[0..6]}
export function isActiveOn(task, date, weekday) {
  if (task.repeat === 'daily') return true;
  if (task.repeat === 'days') return (task.days || []).includes(weekday);
  return task.date === date;
}

// Qaytaradi: [{task, kind:'remind'|'ask'|'followup', date}]
// sent: Set("taskId|date|kind"), answered: Set("taskId|date")
export function dueEvents(tasks, now, tz, sent, answered) {
  const { date, minutes, weekday } = localParts(now, tz);
  const out = [];
  for (const t of tasks) {
    if (!isActiveOn(t, date, weekday)) continue;
    const s = toMin(t.start);
    const e = toMin(t.end);
    const key = (k) => `${t.id}|${date}|${k}`;
    if (answered.has(`${t.id}|${date}`)) continue;
    const remindAt = s - REMIND_BEFORE_MIN;
    if (minutes >= remindAt && minutes < s && !sent.has(key('remind'))) out.push({ task: t, kind: 'remind', date });
    if (minutes >= e && minutes < e + FOLLOWUP_AFTER_MIN && !sent.has(key('ask'))) out.push({ task: t, kind: 'ask', date });
    if (minutes >= e + FOLLOWUP_AFTER_MIN && minutes < e + 60 && sent.has(key('ask')) && !sent.has(key('followup'))) {
      out.push({ task: t, kind: 'followup', date });
    }
  }
  return out;
}

// "09:00-10:30 Sport" yoki "9 10 Sport" kabi matnni vazifaga aylantiradi.
export function parseQuickAdd(text) {
  const m = text.trim().match(/^(\d{1,2})[:.]?(\d{2})?\s*[-–—]\s*(\d{1,2})[:.]?(\d{2})?\s+(.+)$/);
  if (!m) return null;
  const fmt = (h, mm) => `${String(h).padStart(2, '0')}:${mm || '00'}`;
  const start = fmt(m[1], m[2]);
  const end = fmt(m[3], m[4]);
  if (toMin(start) >= toMin(end) || toMin(end) > 24 * 60 || toMin(start) > 23 * 60 + 59) return null;
  let title = m[5].trim();
  let repeat = 'once';
  if (/^(har kuni|kunlik)\s+/i.test(title)) {
    repeat = 'daily';
    title = title.replace(/^(har kuni|kunlik)\s+/i, '');
  }
  return { start, end, title, repeat };
}

export function weeklyStats(logs) {
  const total = logs.length;
  const done = logs.filter((l) => l.status === 'done').length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function streak(dayStatuses) {
  // dayStatuses: {'2026-11-24': true/false} - kun "yaxshi" (kamida 1 bajarilgan va barchasi emas yomon)
  const days = Object.keys(dayStatuses).sort().reverse();
  let n = 0;
  for (const d of days) {
    if (dayStatuses[d]) n++;
    else break;
  }
  return n;
}
