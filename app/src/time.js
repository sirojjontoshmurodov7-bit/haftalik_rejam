// Qurilma vaqti bo'yicha yordamchi funksiyalar (server mantig'iga mos).
export const REMIND_BEFORE_MIN = 15;

export const pad = (n) => String(n).padStart(2, '0');
export const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

export function isActiveOn(task, d) {
  if (task.repeat === 'daily') return true;
  if (task.repeat === 'days') return (task.days || []).includes(d.getDay());
  return task.date === dateStr(d);
}

export function atTime(d, hhmm) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setMinutes(toMin(hhmm));
  return x;
}

export function validHHMM(s) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(s); }

// Keyingi `days` kun uchun kelajakdagi eslatma vaqtlarini hisoblaydi.
export function upcomingEvents(tasks, now = new Date(), days = 7, answered = new Set()) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    for (const t of tasks) {
      if (!isActiveOn(t, d)) continue;
      const date = dateStr(d);
      if (answered.has(`${t.id}|${date}`)) continue;
      const remindAt = new Date(atTime(d, t.start).getTime() - REMIND_BEFORE_MIN * 60000);
      const askAt = atTime(d, t.end);
      const followAt = new Date(askAt.getTime() + 5 * 60000);
      if (remindAt > now) out.push({ id: `${t.id}|${date}|remind`, at: remindAt, kind: 'remind', task: t, date });
      if (askAt > now) out.push({ id: `${t.id}|${date}|ask`, at: askAt, kind: 'ask', task: t, date });
      if (followAt > now) out.push({ id: `${t.id}|${date}|followup`, at: followAt, kind: 'followup', task: t, date });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}
