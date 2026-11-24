import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Platform, Pressable, SafeAreaView, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { loadTasks, saveTasks, loadSession, saveSession, loadAnswers, mergeAnswers } from './src/storage';
import { dateStr, isActiveOn, validHHMM, toMin } from './src/time';
import { login, queueTaskOp, pushAllLocal, pullState, syncNow } from './src/api';
import { ensurePermission, exactAlarmOk, openAlarmSettings, openBatterySettings, openPowerManager, rescheduleAll, handleAnswer } from './src/notify';

const DAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// Hum: qog'oz, siyoh, uchta alohida urg'u (pear = amal, ko'k = havola, marjon = urg'u), yalpiz = o'sish.
const C = {
  paper: '#f6f1e3', paper2: '#eee7d3', paper3: '#e4dcc4', card: '#fbf9f2', ink: '#171a22', ink2: '#2a2e38', muted: '#5b6070', rule: '#ddd6c2', edge: '#d3c9a8',
  pear: '#f6d84a', pearDeep: '#cfa81c', blue: '#2f62c8', coral: '#f4766b', mint: '#6fe0a3', mintDeep: '#1f7a4d', leaf: '#46b06a', hill1: '#ecf3d6', hill2: '#e1edcc', kraft: '#a77c52',
};
const HEADS = [['o', C.blue], ['u', C.coral], ['x', C.mintDeep], ['y', C.pearDeep], ['v', C.blue]];
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

export default function App() {
  const [tab, setTab] = useState('today');
  const [tasks, setTasks] = useState([]);
  const [answers, setAnswers] = useState({});
  const [session, setSession] = useState(null);
  const [alarmOk, setAlarmOk] = useState(true);

  const refresh = useCallback(async () => {
    setTasks(await loadTasks());
    setAnswers(await loadAnswers());
    setSession(await loadSession());
    setAlarmOk(await exactAlarmOk());
  }, []);

  const sync = useCallback(async () => {
    try {
      await syncNow(); // avval yuborilmagan amallar, keyin serverdan olish
      const st = await pullState();
      if (st) {
        await saveTasks(st.tasks);
        await mergeAnswers(st.logs);
      }
    } catch { /* offlayn: mahalliy ma'lumot bilan davom etamiz */ }
    await rescheduleAll();
    await refresh();
  }, [refresh]);

  useEffect(() => {
    (async () => { await ensurePermission(); await refresh(); await sync(); })();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && sync());
    return () => sub.remove();
  }, [refresh, sync]);

  const addTask = async (t) => {
    const next = [...tasks, t];
    setTasks(next);
    await saveTasks(next);
    await rescheduleAll();
    queueTaskOp({ op: 'add', task: t }).catch(() => {});
  };
  const removeTask = async (id) => {
    const next = tasks.filter((t) => t.id !== id);
    setTasks(next);
    await saveTasks(next);
    await rescheduleAll();
    queueTaskOp({ op: 'del', id }).catch(() => {});
  };
  const answer = async (taskId, status) => {
    await handleAnswer(taskId, dateStr(new Date()), status);
    setAnswers(await loadAnswers());
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <Text style={s.h1}>Haftalik rejam</Text>
      {!alarmOk && (
        <Pressable style={s.warn} onPress={openAlarmSettings}>
          <Text style={s.warnT}>Aniq alarm ruxsati o'chiq, eslatma kechikishi mumkin. Yoqish uchun bosing.</Text>
        </Pressable>
      )}
      <View style={s.tabs}>
        {[['today', 'Bugun'], ['add', 'Qo\'shish'], ['set', 'Sozlama']].map(([k, l]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[s.tab, tab === k && s.tabOn]}><Text style={tab === k ? s.tabOnT : s.tabT}>{l}</Text></Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {tab === 'today' && <Today tasks={tasks} answers={answers} onAnswer={answer} onDelete={removeTask} />}
        {tab === 'add' && <Add onAdd={async (t) => { await addTask(t); setTab('today'); }} />}
        {tab === 'set' && <Settings session={session} onLogin={async (url, code) => {
          try { await saveSession(await login(url, code)); await pushAllLocal(tasks).catch(() => {}); await sync(); Alert.alert('Ulandi', 'Bot bilan sinxronlash yoqildi.'); }
          catch (e) { Alert.alert('Xato', e.message); }
        }} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Btn({ children, onPress, kind = 'card', on, small, style }) {
  const tone = kind === 'primary' ? s.btnPrimary : on === 'done' ? s.btnDone : on === 'missed' ? s.btnMissed : s.btnCard;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.btn, small && s.btnSm, tone, pressed && s.btnPressed, style]}>
      <Text style={[s.btnT, small && { fontSize: 14 }]}>{children}</Text>
    </Pressable>
  );
}

function Garden({ answers }) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  let total = 0;
  const cols = ORDER.map((wd, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const date = dateStr(d);
    const keys = Object.keys(answers).filter((k) => k.endsWith(`|${date}`) && answers[k] === 'done').slice(0, 7);
    total += keys.length;
    return { wd, date, keys, today: date === dateStr(now) };
  });
  return (
    <View style={s.garden}>
      <Text style={s.h2}>Hafta bog'i</Text>
      <Text style={s.muted}>Har bajarilgan vazifa bitta o'simlik.</Text>
      <View style={s.bed}>
        <View style={s.cols}>
          {cols.map((c) => (
            <View key={c.date} style={s.col}>
              {c.keys.map((k, n) => {
                const h = hash(k);
                const [g, color] = HEADS[h % HEADS.length];
                const dx = Math.round((n - (c.keys.length - 1) / 2) * 10);
                const ph = 36 + (h >>> 3) % 60;
                return (
                  <View key={k} style={[s.plant, { height: ph, marginLeft: dx - 10 }]}>
                    <View style={s.stem} />
                    <Text style={[s.head, { color }]}>{g}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
        <View style={s.soil}>
          {cols.map((c) => <Text key={c.date} style={[s.soilT, c.today && s.soilToday]}>{DAYS[c.wd]}</Text>)}
        </View>
      </View>
      <Text style={[s.muted, { marginTop: 6 }]}>{total} ta o'simlik bu hafta</Text>
    </View>
  );
}

function Today({ tasks, answers, onAnswer, onDelete }) {
  const now = new Date();
  const date = dateStr(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const list = tasks.filter((t) => isActiveOn(t, now)).sort((a, b) => toMin(a.start) - toMin(b.start));
  const done = list.filter((t) => answers[`${t.id}|${date}`] === 'done').length;
  return (
    <View>
      <Text style={s.h2}>Bugun</Text>
      <Text style={s.muted}>{now.getDate()}-{MONTHS[now.getMonth()]}, {WEEKDAYS[now.getDay()]}</Text>
      <View style={s.progressRow}>
        <Text style={s.big}>{done}/{list.length}</Text><Text style={[s.muted, { marginLeft: 8 }]}>bajarildi</Text>
      </View>
      <View style={s.track}><View style={[s.fill, { width: `${list.length ? (done / list.length) * 100 : 0}%` }]} /></View>

      <Garden answers={answers} />

      {!list.length && (
        <View style={s.empty}>
          <Text style={s.title}>Bugun reja yo'q</Text>
          <Text style={[s.muted, { textAlign: 'center' }]}>"Qo'shish" bo'limidan vazifa qo'shing yoki botga 09:00-10:30 Sport deb yozing.</Text>
        </View>
      )}
      {list.map((t) => {
        const a = answers[`${t.id}|${date}`];
        const live = !a && toMin(t.start) <= nowMin && nowMin < toMin(t.end);
        return (
          <View key={t.id} style={[s.card, a === 'done' && s.cardDone, a === 'missed' && s.cardMissed, live && s.cardNow]}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text style={s.time}>{t.start}</Text><Text style={s.muted}>{t.end}</Text>
              {live && <Text style={s.nowTag}>hozir</Text>}
            </View>
            <Text style={s.title}>{t.title}</Text>
            <Text style={s.muted}>{t.repeat === 'daily' ? 'har kuni' : t.repeat === 'days' ? t.days.map((d) => DAYS[d]).join(', ') : 'bir martalik'}</Text>
            <View style={s.acts}>
              <Btn small on={a === 'done' ? 'done' : undefined} onPress={() => a !== 'done' && onAnswer(t.id, 'done')}>Bajardim</Btn>
              <Btn small on={a === 'missed' ? 'missed' : undefined} onPress={() => a !== 'missed' && onAnswer(t.id, 'missed')}>Bajarmadim</Btn>
              <Pressable onPress={() => Alert.alert('O\'chirish', `"${t.title}" o'chirilsinmi?`, [{ text: 'Yo\'q' }, { text: 'Ha', style: 'destructive', onPress: () => onDelete(t.id) }])} style={s.del}>
                <Text style={s.delT}>O'chirish</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Add({ onAdd }) {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [repeat, setRepeat] = useState('once');
  const [days, setDays] = useState([]);
  const submit = () => {
    if (!title.trim()) return Alert.alert('Nomini yozing');
    if (!validHHMM(start) || !validHHMM(end) || toMin(start) >= toMin(end)) return Alert.alert('Vaqt noto\'g\'ri', 'Format SS:DD (masalan 09:30), tugash vaqti boshlanishdan keyin bo\'lsin.');
    if (repeat === 'days' && !days.length) return Alert.alert('Hafta kunlarini tanlang');
    onAdd({ id: uid(), title: title.trim(), start, end, repeat, days: repeat === 'days' ? days : [], date: repeat === 'once' ? dateStr(new Date()) : null });
    setTitle('');
  };
  return (
    <View>
      <Text style={s.h2}>Yangi vazifa</Text>
      <Text style={s.label}>Nomi</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Masalan: Sport" placeholderTextColor={C.muted} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Text style={s.label}>Boshlanishi</Text><TextInput style={s.input} value={start} onChangeText={setStart} keyboardType="numbers-and-punctuation" /></View>
        <View style={{ flex: 1 }}><Text style={s.label}>Tugashi</Text><TextInput style={s.input} value={end} onChangeText={setEnd} keyboardType="numbers-and-punctuation" /></View>
      </View>
      <Text style={s.label}>Takrorlash</Text>
      <View style={s.row}>
        {[['once', 'Bugun'], ['daily', 'Har kuni'], ['days', 'Hafta kunlari']].map(([k, l]) => (
          <Pressable key={k} onPress={() => setRepeat(k)} style={[s.chip, repeat === k && s.chipOn]}><Text style={repeat === k ? s.chipOnT : s.chipT}>{l}</Text></Pressable>
        ))}
      </View>
      {repeat === 'days' && (
        <View style={s.row}>
          {ORDER.map((i) => (
            <Pressable key={i} onPress={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i])} style={[s.chip, days.includes(i) && s.chipOn]}><Text style={days.includes(i) ? s.chipOnT : s.chipT}>{DAYS[i]}</Text></Pressable>
          ))}
        </View>
      )}
      <Btn kind="primary" onPress={submit} style={{ marginTop: 24 }}>Saqlash</Btn>
    </View>
  );
}

function Settings({ session, onLogin }) {
  const [url, setUrl] = useState(session?.apiUrl || 'https://haftalik-rejam.onrender.com');
  const [code, setCode] = useState('');
  return (
    <View>
      <Text style={s.h2}>Telegram bot bilan ulash</Text>
      <Text style={s.muted}>Botda /start yuboring, u 6 xonali kod beradi. Server manzilini va kodni kiriting.</Text>
      <Text style={s.label}>Server manzili</Text>
      <TextInput style={s.input} value={url} onChangeText={setUrl} autoCapitalize="none" placeholder="https://sizning-server.app" placeholderTextColor={C.muted} />
      <Text style={s.label}>Kod</Text>
      <TextInput style={s.input} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
      <Btn kind="primary" onPress={() => onLogin(url.trim(), code.trim())} style={{ marginTop: 20 }}>{session ? 'Qayta ulash' : 'Ulash'}</Btn>
      {session && <Text style={[s.muted, { marginTop: 8 }]}>Ulangan</Text>}

      <Text style={[s.h2, { marginTop: 28 }]}>Xiaomi, Redmi, Poco uchun muhim</Text>
      <Text style={s.muted}>Eslatma o'z vaqtida kelishi uchun quyidagilarni bajaring:</Text>
      <Text style={s.step}>1. Batareya: "Cheklovsiz" qiling.</Text>
      <Btn onPress={openBatterySettings} small style={s.setBtn}>Batareya sozlamasini ochish</Btn>
      <Text style={s.step}>2. Avtomatik ishga tushirish (Autostart) ni yoqing.</Text>
      <Btn onPress={openPowerManager} small style={s.setBtn}>Quvvat boshqaruvini ochish</Btn>
      <Text style={s.step}>3. Aniq alarm ruxsati.</Text>
      <Btn onPress={openAlarmSettings} small style={s.setBtn}>Alarm ruxsatini ochish</Btn>
      <Text style={s.step}>4. So'nggi ilovalar ro'yxatida ilovani qulflang (kartani pastga tortib qulf belgisini bosing).</Text>
      <Text style={s.muted}>Shunda ham ilova o'chsa, Telegram bot eslatmani baribir yuboradi.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper, paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0 },
  h1: { fontSize: 24, fontWeight: '600', color: C.ink, padding: 16, paddingBottom: 8 },
  h2: { fontSize: 22, fontWeight: '600', color: C.ink, marginBottom: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: C.paper2 },
  tabOn: { backgroundColor: C.ink }, tabT: { color: C.ink2, fontWeight: '500' }, tabOnT: { color: C.paper, fontWeight: '600' },
  muted: { color: C.muted, fontSize: 14 },
  big: { fontSize: 28, fontWeight: '600', color: C.ink },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 12 },
  track: { height: 10, borderRadius: 999, backgroundColor: C.paper3, overflow: 'hidden', marginTop: 6 },
  fill: { height: '100%', backgroundColor: C.mint, borderRadius: 999 },

  garden: { marginTop: 20 },
  bed: { marginTop: 10, borderRadius: 24, overflow: 'hidden', backgroundColor: C.hill1 },
  cols: { flexDirection: 'row', height: 130, paddingHorizontal: 8 },
  col: { flex: 1, position: 'relative' },
  plant: { position: 'absolute', bottom: -4, left: '50%', width: 20 },
  stem: { position: 'absolute', left: 8.5, bottom: 0, top: 14, width: 3, borderRadius: 2, backgroundColor: C.leaf },
  head: { position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', fontSize: 22, lineHeight: 22, fontWeight: '600' },
  soil: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, backgroundColor: C.kraft },
  soilT: { flex: 1, textAlign: 'center', color: C.card, fontSize: 13, fontWeight: '500' },
  soilToday: { color: C.pear, fontWeight: '700' },

  card: { backgroundColor: C.card, padding: 16, borderRadius: 24, marginTop: 12, borderBottomWidth: 3, borderBottomColor: C.rule },
  cardDone: { backgroundColor: '#e4f4e6' },
  cardMissed: { backgroundColor: '#fbe9e4' },
  cardNow: { borderWidth: 2, borderColor: C.ink },
  time: { fontSize: 16, fontWeight: '700', color: C.ink },
  nowTag: { backgroundColor: C.pear, color: C.ink, fontSize: 12, fontWeight: '600', paddingHorizontal: 10, borderRadius: 999, overflow: 'hidden' },
  title: { fontSize: 18, fontWeight: '600', color: C.ink, marginTop: 4 },
  acts: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  del: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }, delT: { color: C.muted, fontSize: 14 },
  empty: { marginTop: 20, padding: 24, borderRadius: 24, backgroundColor: C.paper2, alignItems: 'center', gap: 6 },

  label: { marginTop: 14, marginBottom: 4, fontWeight: '500', color: C.ink2 },
  input: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.muted, color: C.ink, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: C.paper2 },
  chipOn: { backgroundColor: C.ink }, chipT: { color: C.ink2, fontWeight: '500' }, chipOnT: { color: C.paper, fontWeight: '600' },

  btn: { minHeight: 52, borderRadius: 16, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5 },
  btnSm: { minHeight: 44, paddingHorizontal: 14, borderBottomWidth: 4 },
  btnCard: { backgroundColor: C.card, borderColor: C.edge },
  btnPrimary: { backgroundColor: C.pear, borderColor: C.pearDeep },
  btnDone: { backgroundColor: C.mint, borderColor: C.mintDeep },
  btnMissed: { backgroundColor: C.coral, borderColor: '#b9453c' },
  btnPressed: { borderBottomWidth: 1, marginTop: 3, marginBottom: -3 },
  btnT: { color: C.ink, fontWeight: '600', fontSize: 16 },
  setBtn: { marginTop: 8, alignSelf: 'flex-start' },
  step: { marginTop: 14, fontWeight: '500', color: C.ink2 },
  warn: { backgroundColor: '#fbefc4', marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 14 }, warnT: { color: '#5c4600' },
});
