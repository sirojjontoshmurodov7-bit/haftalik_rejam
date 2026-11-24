// Haftalik rejam: veb-mijoz. Ilova va bot bilan bir xil API.
const $ = (s, r = document) => r.querySelector(s);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* maxfiy rejim */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* maxfiy rejim */ } },
};

const WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
const SHORT = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // hafta dushanbadan boshlanadi
const HEADS = [['o', 'var(--color-accent-2)'], ['u', 'var(--color-accent-3)'], ['x', 'var(--color-mint-deep)'], ['y', 'var(--color-accent-deep)'], ['v', 'var(--color-accent-2)']];

let session = null;
try { session = JSON.parse(store.get('hr.session') || 'null'); } catch { session = null; }
let st = null;          // serverdan kelgan holat
let status = 'loading'; // loading | error | ready
let tab = location.hash === '#hafta' ? 'hafta' : 'bugun';
let picked = null;      // hafta ko'rinishida tanlangan sana
let seen = new Set();   // bog'da allaqachon ko'rsatilgan o'simliklar
let firstGarden = true;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const say = (t) => { $('#live').textContent = t; };

// ---- sana yordamchilari (faqat matn, vaqt zonasi serverdan) ----
const toUtc = (d) => { const [y, m, day] = d.split('-').map(Number); return Date.UTC(y, m - 1, day); };
const fromUtc = (ms) => new Date(ms).toISOString().slice(0, 10);
const addDays = (d, n) => fromUtc(toUtc(d) + n * 864e5);
const weekdayOf = (d) => new Date(toUtc(d)).getUTCDay();
const mondayOf = (d) => addDays(d, -((weekdayOf(d) + 6) % 7));
const prettyDate = (d) => { const [, m, day] = d.split('-').map(Number); return `${day}-${MONTHS[m - 1]}, ${WEEKDAYS[weekdayOf(d)]}`; };
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const isActiveOn = (t, d) => t.repeat === 'daily' || (t.repeat === 'days' && (t.days || []).includes(weekdayOf(d))) || (t.repeat === 'once' && t.date === d);
const nowMinutes = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: st.tz, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return (Number(p.hour) % 24) * 60 + Number(p.minute);
};
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// ---- API ----
async function api(path, method = 'GET', body) {
  const r = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json', 'x-user-id': String(session.userId), 'x-secret': session.secret },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401) { logout(); throw new Error('auth'); }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function load(quiet) {
  if (!session) return;
  if (!quiet) { status = 'loading'; render(); }
  try { st = await api('/api/state'); status = 'ready'; } catch (e) { if (e.message === 'auth') return; if (!st) status = 'error'; }
  render();
}

function logout() { store.del('hr.session'); session = null; st = null; status = 'loading'; seen = new Set(); firstGarden = true; render(); }

// ---- hosilalar ----
const logKey = (id, d) => `${id}|${d}`;
function answers() {
  const m = new Map();
  for (const l of st.logs) m.set(logKey(l.task_id, l.date), l.status);
  return m;
}
function byDate() {
  const m = new Map();
  for (const l of st.logs) { if (!m.has(l.date)) m.set(l.date, []); m.get(l.date).push(l); }
  return m;
}
function streakOf() {
  const days = byDate();
  let n = 0;
  for (let i = 0; i < 45; i++) {
    const logs = days.get(addDays(st.today, -i));
    if (!logs) { if (i === 0) continue; break; }
    if (logs.some((l) => l.status !== 'done')) break;
    n++;
  }
  return n;
}
function bestStreak() {
  const days = byDate();
  let best = 0; let cur = 0;
  for (let i = 44; i >= 0; i--) {
    const logs = days.get(addDays(st.today, -i));
    if (logs && logs.every((l) => l.status === 'done')) { cur++; best = Math.max(best, cur); } else if (logs || i !== 0) cur = 0;
  }
  return best;
}
const repeatText = (t) => (t.repeat === 'daily' ? 'har kuni' : t.repeat === 'days' ? (t.days || []).map((d) => SHORT[d]).join(', ') : 'bir martalik');

// ---- ko'rinishlar ----
function viewBugun() {
  const root = $('#view-bugun');
  if (status === 'loading' || !st) { root.innerHTML = `<h1 id="h-bugun">Bugun</h1><div class="tiles" style="margin-top:var(--space-lg)" aria-busy="true"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>`; return; }
  if (status === 'error') {
    root.innerHTML = `<h1 id="h-bugun">Bugun</h1><div class="errbox" style="margin-top:var(--space-lg)"><h3>Server bilan aloqa yo'q</h3><p>Bepul server uxlab qolgan bo'lishi mumkin, uyg'onishiga yarim daqiqa ketadi.</p><button class="btn btn--primary" data-act="retry" type="button">Qayta urinish</button></div>`;
    return;
  }
  const ans = answers();
  const list = st.tasks.filter((t) => isActiveOn(t, st.today)).sort((a, b) => toMin(a.start) - toMin(b.start));
  const done = list.filter((t) => ans.get(logKey(t.id, st.today)) === 'done').length;
  const nm = nowMinutes();
  const p = list.length ? done / list.length : 0;
  const tiles = list.map((t) => {
    const a = ans.get(logKey(t.id, st.today));
    const live = !a && toMin(t.start) <= nm && nm < toMin(t.end);
    return `<li class="tile" data-id="${esc(t.id)}" data-state="${a || 'open'}" ${live ? 'data-now="1"' : ''}>
      <div class="when num">${esc(t.start)}<span>${esc(t.end)}</span></div>
      <div class="what"><h3>${esc(t.title)}${live ? '<span class="now-tag">hozir</span>' : ''}</h3><p class="muted">${esc(repeatText(t))}</p></div>
      <div class="acts">
        <button class="btn btn--sm" type="button" data-act="done" aria-pressed="${a === 'done'}">Bajardim</button>
        <button class="btn btn--sm" type="button" data-act="missed" aria-pressed="${a === 'missed'}">Bajarmadim</button>
        <button class="icon-btn" type="button" data-act="del" aria-label="${esc(t.title)} vazifasini o'chirish"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"/></svg></button>
      </div></li>`;
  }).join('');
  const body = list.length
    ? `<ul class="tiles">${tiles}</ul>`
    : `<div class="empty"><h3>Bugun reja yo'q</h3><p>Birinchi vazifani pastdagi shakldan qo'shing, yoki botga <b>09:00-10:30 Sport</b> deb yozing.</p></div>`;
  root.innerHTML = `<div class="day"><div>
      <div class="day-head"><div><h1 id="h-bugun">Bugun</h1><p class="muted">${esc(prettyDate(st.today))}</p></div>
        <div class="progress"><b class="num">${done}/${list.length}</b><span>bajarildi</span><div class="bar-track" role="progressbar" aria-valuemin="0" aria-valuemax="${list.length}" aria-valuenow="${done}"><i style="--p:${p}"></i></div></div></div>
      ${body}
      ${addForm()}
    </div>${garden()}</div>`;
}

function addForm() {
  return `<form class="add" id="add" novalidate>
    <h2>Yangi vazifa</h2>
    <div class="add-grid">
      <div><label for="f-title">Nomi</label><input class="input" id="f-title" maxlength="200" placeholder="Masalan: Sport" required></div>
      <div><label for="f-start">Boshlanishi</label><input class="input num" id="f-start" type="time" value="09:00" required></div>
      <div><label for="f-end">Tugashi</label><input class="input num" id="f-end" type="time" value="10:00" required></div>
    </div>
    <p class="label">Takrorlash</p>
    <div class="pills" role="radiogroup" aria-label="Takrorlash">
      <label class="pill"><input type="radio" name="rep" value="once" checked><span>Bugun</span></label>
      <label class="pill"><input type="radio" name="rep" value="daily"><span>Har kuni</span></label>
      <label class="pill"><input type="radio" name="rep" value="days"><span>Hafta kunlari</span></label>
    </div>
    <div class="pills days" id="f-days" hidden>${ORDER.map((d) => `<label class="pill"><input type="checkbox" value="${d}"><span>${SHORT[d]}</span></label>`).join('')}</div>
    <p class="form-error" id="f-error" role="alert" hidden></p>
    <button class="btn btn--primary" type="submit">Qo'shish</button>
  </form>`;
}

function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

function garden() {
  const monday = mondayOf(st.today);
  const doneBy = new Map();
  for (const l of st.logs) if (l.status === 'done' && l.date >= monday && l.date <= addDays(monday, 6)) { if (!doneBy.has(l.date)) doneBy.set(l.date, []); doneBy.get(l.date).push(l); }
  const next = new Set();
  const cols = ORDER.map((_, i) => {
    const d = addDays(monday, i);
    const dayLogs = (doneBy.get(d) || []).slice(0, 7);
    const plants = dayLogs.map((l, k) => {
      const key = `${l.task_id}|${l.date}`; next.add(key);
      const h = hash(key);
      const [glyph, color] = HEADS[h % HEADS.length];
      const isNew = !firstGarden && !seen.has(key);
      const dx = Math.round((k - (dayLogs.length - 1) / 2) * 13);
      return `<span class="plant${isNew ? ' is-new' : ''}" style="--h:${50 + ((h >>> 3) % 90)}px;--c:${color};--dx:${dx}px"><b aria-hidden="true">${glyph}</b></span>`;
    }).join('');
    return `<div class="col">${plants}</div>`;
  }).join('');
  seen = next; firstGarden = false;
  const total = [...doneBy.values()].reduce((n, a) => n + a.length, 0);
  const labels = ORDER.map((wd, i) => `<span${addDays(monday, i) === st.today ? ' aria-current="date"' : ''}>${SHORT[wd]}</span>`).join('');
  return `<aside class="garden" aria-label="Hafta bog'i"><h2>Hafta bog'i</h2>
    <p class="muted">Har bajarilgan vazifa bitta o'simlik.</p>
    <div class="bed" role="img" aria-label="Bu hafta ${total} ta vazifa bajarilgan"><div class="cols">${cols}</div><div class="soil" data-torn>${'' /* yirtilgan chet JS bilan */}<div class="labels">${labels}</div></div></div>
    <p class="muted garden-note"><b class="num">${total}</b> ta o'simlik bu hafta</p></aside>`;
}

function viewHafta() {
  const root = $('#view-hafta');
  if (status !== 'ready') { root.innerHTML = `<h1 id="h-hafta">Hafta</h1><div class="skel" style="margin-top:var(--space-lg)"></div>`; return; }
  const days = byDate();
  const monday = mondayOf(st.today);
  const weekLogs = [];
  for (let i = 0; i < 7; i++) weekLogs.push(...(days.get(addDays(monday, i)) || []));
  const done = weekLogs.filter((l) => l.status === 'done').length;
  const pct = weekLogs.length ? Math.round((done / weekLogs.length) * 100) : 0;
  const start = addDays(monday, -35);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    const logs = days.get(d) || [];
    const dn = logs.filter((l) => l.status === 'done').length;
    const level = !logs.length ? 0 : dn === logs.length ? 3 : dn / logs.length >= 0.5 ? 2 : 1;
    const future = d > st.today;
    cells.push(`<button class="cell num" type="button" data-day="${d}" data-l="${level}" ${future ? 'data-future="1" disabled' : ''} ${d === st.today ? 'aria-current="date"' : ''} aria-pressed="${picked === d}" aria-label="${esc(prettyDate(d))}: ${logs.length ? `${dn}/${logs.length} bajarildi` : 'yozuv yo\'q'}">${Number(d.slice(8))}</button>`);
  }
  let detail = '<div class="detail"><h2>Kun tafsiloti</h2><p class="muted" style="margin-top:var(--space-xs)">Kvadratni bosing, o\'sha kundagi vazifalar shu yerda ochiladi.</p></div>';
  if (picked) {
    const tasks = new Map(st.tasks.map((t) => [String(t.id), t.title]));
    const logs = days.get(picked) || [];
    const word = { done: 'bajarildi', missed: 'bajarilmadi' };
    detail = `<div class="detail"><h2>${esc(prettyDate(picked))}</h2>${logs.length ? `<ul>${logs.map((l) => `<li data-s="${esc(l.status)}"><span>${esc(tasks.get(String(l.task_id)) || 'O\'chirilgan vazifa')}</span><span class="muted">${word[l.status] || ''}</span></li>`).join('')}</ul>` : '<p class="muted" style="margin-top:var(--space-xs)">Bu kunda javob yozilmagan.</p>'}</div>`;
  }
  root.innerHTML = `<h1 id="h-hafta">Hafta</h1>
    <div class="figures">
      <div class="figure-card"><b class="num">${done}/${weekLogs.length}</b><span>bu hafta bajarildi</span></div>
      <div class="figure-card"><b class="num">${pct}%</b><span>haftalik natija</span></div>
      <div class="figure-card"><b class="num">${bestStreak()}</b><span>eng uzun seriya, kun</span></div>
    </div>
    <div class="week-body"><div>
      <h2 style="margin-bottom:var(--space-sm)">Oxirgi 6 hafta</h2>
      <div class="heat">${ORDER.map((d) => `<span class="heat-h">${SHORT[d]}</span>`).join('')}${cells.join('')}</div>
      <div class="legend" aria-hidden="true"><span class="muted">Kam</span><i data-l="0"></i><i data-l="1"></i><i data-l="2"></i><i data-l="3"></i><span class="muted">Ko'p</span></div>
    </div>${detail}</div>`;
}

function tornEdges() {
  document.querySelectorAll('[data-torn]').forEach((el) => {
    let seed = hash(el.className) + 7; const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const pts = ['0% 100%', '0% 8px'];
    for (let x = 4; x < 100; x += 4) pts.push(`${x}% ${Math.round(r() * 7)}px`);
    pts.push('100% 6px', '100% 100%');
    el.style.clipPath = `polygon(${pts.join(',')})`;
    el.style.marginTop = '-7px';
  });
}

function render() {
  $('#login').hidden = !!session;
  $('#shell').hidden = !session;
  if (!session) { setTimeout(() => $('#code')?.focus(), 0); return; }
  $('#tab-bugun').setAttribute('aria-current', tab === 'bugun' ? 'page' : 'false');
  $('#tab-hafta').setAttribute('aria-current', tab === 'hafta' ? 'page' : 'false');
  $('#view-bugun').hidden = tab !== 'bugun';
  $('#view-hafta').hidden = tab !== 'hafta';
  const n = st ? streakOf() : 0;
  $('#streak').innerHTML = st ? `<b class="num">${n}</b>kun ketma-ket` : '';
  const keep = { title: $('#f-title')?.value, start: $('#f-start')?.value, end: $('#f-end')?.value };
  const focusId = document.activeElement?.id;
  if (tab === 'bugun') viewBugun(); else viewHafta();
  if (keep.title !== undefined && $('#f-title')) { $('#f-title').value = keep.title; $('#f-start').value = keep.start; $('#f-end').value = keep.end; if (focusId) $('#' + focusId)?.focus(); }
  tornEdges();
}

// ---- hodisalar ----
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = $('#code').value.trim();
  const err = $('#login-error');
  err.hidden = true;
  if (!/^\d{6}$/.test(code)) { err.textContent = 'Kod 6 ta raqamdan iborat.'; err.hidden = false; return; }
  const btn = e.submitter; if (btn) btn.disabled = true;
  try {
    const r = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
    if (r.status === 404) throw new Error('Kod topilmadi. Botga /start yuborib, yangi kodni oling.');
    if (!r.ok) throw new Error(`Server xatosi (${r.status})`);
    const j = await r.json();
    session = { userId: j.userId, secret: j.secret };
    store.set('hr.session', JSON.stringify(session));
    $('#code').value = '';
    load();
  } catch (x) { err.textContent = x.message.startsWith('Failed') ? 'Serverga ulanib bo\'lmadi. Bir ozdan keyin qayta urining.' : x.message; err.hidden = false; }
  finally { if (btn) btn.disabled = false; }
});
$('#logout').addEventListener('click', logout);
addEventListener('hashchange', () => { tab = location.hash === '#hafta' ? 'hafta' : 'bugun'; render(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) load(true); });
setInterval(() => { if (session && !document.hidden) load(true); }, 60000);

let sureTimer = 0;
document.addEventListener('click', async (e) => {
  const cell = e.target.closest('[data-day]');
  if (cell && !cell.disabled) { picked = picked === cell.dataset.day ? null : cell.dataset.day; render(); return; }
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  if (act === 'retry') return load();
  const li = btn.closest('.tile');
  if (!li) return;
  const id = li.dataset.id;
  if (act === 'del') {
    if (btn.dataset.sure !== '1') { btn.dataset.sure = '1'; btn.textContent = 'O\'chirasizmi?'; clearTimeout(sureTimer); sureTimer = setTimeout(() => render(), 3000); return; }
    clearTimeout(sureTimer);
    try { await api(`/api/tasks/${encodeURIComponent(id)}`, 'DELETE'); st.tasks = st.tasks.filter((t) => String(t.id) !== id); render(); say('Vazifa o\'chirildi'); }
    catch { say('O\'chirib bo\'lmadi, qayta urining'); render(); }
    return;
  }
  const date = st.today;
  if (btn.getAttribute('aria-pressed') === 'true') return; // javobni o'zgartirish mumkin, bekor qilib bo'lmaydi
  const prev = st.logs.slice();
  st.logs = st.logs.filter((l) => !(String(l.task_id) === id && l.date === date));
  st.logs.push({ task_id: id, date, status: act, source: 'web', ts: Date.now() });
  render();
  try { await api('/api/answer', 'POST', { taskId: id, date, status: act }); say(act === 'done' ? 'Bajarildi deb belgilandi' : 'Bajarilmadi deb belgilandi'); }
  catch { st.logs = prev; render(); say('Saqlanmadi, qayta urining'); }
});

document.addEventListener('change', (e) => {
  if (e.target.name === 'rep') $('#f-days').hidden = e.target.value !== 'days';
});

document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'add') return;
  e.preventDefault();
  const title = $('#f-title').value.trim();
  const start = $('#f-start').value; const end = $('#f-end').value;
  const repeat = document.querySelector('input[name="rep"]:checked').value;
  const days = [...document.querySelectorAll('#f-days input:checked')].map((i) => Number(i.value));
  const err = $('#f-error');
  const fail = (m) => { err.textContent = m; err.hidden = false; };
  err.hidden = true;
  if (!title) return fail('Vazifa nomini yozing.');
  if (!start || !end || toMin(start) >= toMin(end)) return fail('Tugash vaqti boshlanishdan keyin bo\'lsin.');
  if (repeat === 'days' && !days.length) return fail('Hafta kunlarini tanlang.');
  const task = { id: uid(), title, start, end, repeat, days: repeat === 'days' ? days : [], date: repeat === 'once' ? st.today : null };
  const btn = e.submitter; if (btn) btn.disabled = true;
  try { await api('/api/tasks', 'POST', { task }); st.tasks.push(task); render(); say('Vazifa qo\'shildi'); }
  catch { fail('Saqlanmadi. Aloqani tekshirib, qayta urining.'); if (btn) btn.disabled = false; }
});

render();
if (session) load();
