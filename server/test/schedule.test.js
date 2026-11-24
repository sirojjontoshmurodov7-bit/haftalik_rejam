import test from 'node:test';
import assert from 'node:assert/strict';
import { dueEvents, parseQuickAdd, weeklyStats, streak, localParts } from '../src/schedule.js';

const TZ = 'Asia/Tashkent'; // UTC+5
// 2026-11-24 09:50 Toshkent = 04:50 UTC
const at = (hhmm) => new Date(`2026-11-24T${hhmm}:00+05:00`);
const task = { id: 1, title: 'Sport', start: '10:00', end: '11:00', repeat: 'daily' };

test('localParts Toshkent vaqti', () => {
  const p = localParts(at('09:50'), TZ);
  assert.equal(p.date, '2026-11-24');
  assert.equal(p.minutes, 9 * 60 + 50);
});

test('15 daqiqa oldin eslatma', () => {
  assert.equal(dueEvents([task], at('09:44'), TZ, new Set(), new Set()).length, 0);
  const ev = dueEvents([task], at('09:45'), TZ, new Set(), new Set());
  assert.equal(ev[0].kind, 'remind');
});

test('eslatma ikki marta yuborilmaydi', () => {
  const sent = new Set(['1|2026-11-24|remind']);
  assert.equal(dueEvents([task], at('09:50'), TZ, sent, new Set()).length, 0);
});

test('tugaganda so\'rov, keyin follow-up', () => {
  assert.equal(dueEvents([task], at('11:00'), TZ, new Set(), new Set())[0].kind, 'ask');
  const sent = new Set(['1|2026-11-24|ask']);
  assert.equal(dueEvents([task], at('11:06'), TZ, sent, new Set())[0].kind, 'followup');
});

test('javob berilgan vazifaga hech narsa yuborilmaydi', () => {
  assert.equal(dueEvents([task], at('11:06'), TZ, new Set(['1|2026-11-24|ask']), new Set(['1|2026-11-24'])).length, 0);
});

test('bir martalik vazifa faqat o\'z kunida', () => {
  const once = { ...task, repeat: 'once', date: '2026-11-25' };
  assert.equal(dueEvents([once], at('09:50'), TZ, new Set(), new Set()).length, 0);
});

test('parseQuickAdd', () => {
  assert.deepEqual(parseQuickAdd('09:00-10:30 Sport'), { start: '09:00', end: '10:30', title: 'Sport', repeat: 'once' });
  assert.equal(parseQuickAdd('9-10 har kuni Kitob').repeat, 'daily');
  assert.equal(parseQuickAdd('9-10 har kuni Kitob').title, 'Kitob');
  assert.equal(parseQuickAdd('10:00-09:00 Xato'), null);
  assert.equal(parseQuickAdd('salom'), null);
});

test('statistika va streak', () => {
  assert.deepEqual(weeklyStats([{ status: 'done' }, { status: 'missed' }, { status: 'done' }, { status: 'done' }]), { total: 4, done: 3, percent: 75 });
  assert.equal(streak({ '2026-11-22': true, '2026-11-23': true, '2026-11-24': true }), 3);
  assert.equal(streak({ '2026-11-22': false, '2026-11-23': true, '2026-11-24': true }), 2);
});
