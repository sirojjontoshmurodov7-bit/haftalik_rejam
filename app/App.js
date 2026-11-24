import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { loadTasks, saveTasks, loadSession, saveSession, loadAnswers, mergeAnswers } from './src/storage';
import { dateStr, isActiveOn, validHHMM, toMin } from './src/time';
import { login, pushTasks, pullState, flushPending } from './src/api';
import { ensurePermission, exactAlarmOk, openAlarmSettings, openBatterySettings, openPowerManager, rescheduleAll } from './src/notify';

const DAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

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
      await flushPending();
      const st = await pullState();
      if (st) {
        // Server (bot qo'shgan vazifalar ham) asosiy manba; javoblarni birlashtiramiz
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

  const persist = async (next) => {
    setTasks(next);
    await saveTasks(next);
    await rescheduleAll();
    pushTasks(next).catch(() => {});
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <Text style={s.h1}>Haftalik rejam</Text>
      {!alarmOk && (
        <Pressable style={s.warn} onPress={openAlarmSettings}>
          <Text style={s.warnT}>⚠️ Aniq alarm ruxsati o'chiq: eslatma kechikishi mumkin. Yoqish uchun bosing.</Text>
        </Pressable>
      )}
      <View style={s.tabs}>
        {[['today', 'Bugun'], ['add', 'Qo\'shish'], ['set', 'Sozlama']].map(([k, l]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[s.tab, tab === k && s.tabOn]}><Text style={tab === k ? s.tabOnT : s.tabT}>{l}</Text></Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {tab === 'today' && <Today tasks={tasks} answers={answers} onDelete={(id) => persist(tasks.filter((t) => t.id !== id))} />}
        {tab === 'add' && <Add onAdd={async (t) => { await persist([...tasks, t]); setTab('today'); }} />}
        {tab === 'set' && <Settings session={session} onLogin={async (url, code) => {
          try { await saveSession(await login(url, code)); await pushTasks(tasks).catch(() => {}); await sync(); Alert.alert('Ulandi', 'Bot bilan sinxronlash yoqildi.'); }
          catch (e) { Alert.alert('Xato', e.message); }
        }} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Today({ tasks, answers, onDelete }) {
  const now = new Date();
  const date = dateStr(now);
  const list = tasks.filter((t) => isActiveOn(t, now)).sort((a, b) => toMin(a.start) - toMin(b.start));
  const done = list.filter((t) => answers[`${t.id}|${date}`] === 'done').length;
  if (!list.length) return <Text style={s.muted}>Bugun reja yo'q. "Qo'shish" bo'limidan vazifa qo'shing.</Text>;
  return (
    <View>
      <Text style={s.muted}>Bajarildi: {done}/{list.length}</Text>
      {list.map((t) => {
        const a = answers[`${t.id}|${date}`];
        return (
          <View key={t.id} style={s.card}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{a === 'done' ? '✅ ' : a === 'missed' ? '❌ ' : ''}{t.title}</Text>
              <Text style={s.muted}>{t.start}-{t.end}{t.repeat === 'daily' ? ' · har kuni' : t.repeat === 'days' ? ' · ' + t.days.map((d) => DAYS[d]).join(',') : ''}</Text>
            </View>
            <Pressable onPress={() => Alert.alert('O\'chirish', `"${t.title}" o'chirilsinmi?`, [{ text: 'Yo\'q' }, { text: 'Ha', style: 'destructive', onPress: () => onDelete(t.id) }])}>
              <Text style={{ fontSize: 20 }}>🗑</Text>
            </Pressable>
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
    onAdd({ id: uid(), title: title.trim(), start, end, repeat, days, date: repeat === 'once' ? dateStr(new Date()) : null });
    setTitle('');
  };
  return (
    <View>
      <Text style={s.label}>Nomi</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Masalan: Sport" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Text style={s.label}>Boshlanishi</Text><TextInput style={s.input} value={start} onChangeText={setStart} keyboardType="numbers-and-punctuation" /></View>
        <View style={{ flex: 1 }}><Text style={s.label}>Tugashi</Text><TextInput style={s.input} value={end} onChangeText={setEnd} keyboardType="numbers-and-punctuation" /></View>
      </View>
      <Text style={s.label}>Takrorlash</Text>
      <View style={s.row}>
        {[['once', 'Bugun'], ['daily', 'Har kuni'], ['days', 'Hafta kunlari']].map(([k, l]) => (
          <Pressable key={k} onPress={() => setRepeat(k)} style={[s.chip, repeat === k && s.chipOn]}><Text style={repeat === k ? s.chipOnT : undefined}>{l}</Text></Pressable>
        ))}
      </View>
      {repeat === 'days' && (
        <View style={s.row}>
          {DAYS.map((d, i) => (
            <Pressable key={d} onPress={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i])} style={[s.chip, days.includes(i) && s.chipOn]}><Text style={days.includes(i) ? s.chipOnT : undefined}>{d}</Text></Pressable>
          ))}
        </View>
      )}
      <Pressable style={s.btn} onPress={submit}><Text style={s.btnT}>Saqlash</Text></Pressable>
    </View>
  );
}

function Settings({ session, onLogin }) {
  const [url, setUrl] = useState(session?.apiUrl || '');
  const [code, setCode] = useState('');
  return (
    <View>
      <Text style={s.h2}>Telegram bot bilan ulash</Text>
      <Text style={s.muted}>Botda /start yuboring, u 6 xonali kod beradi. Server manzilini va kodni kiriting.</Text>
      <Text style={s.label}>Server manzili</Text>
      <TextInput style={s.input} value={url} onChangeText={setUrl} autoCapitalize="none" placeholder="https://sizning-server.app" />
      <Text style={s.label}>Kod</Text>
      <TextInput style={s.input} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
      <Pressable style={s.btn} onPress={() => onLogin(url.trim(), code.trim())}><Text style={s.btnT}>{session ? 'Qayta ulash' : 'Ulash'}</Text></Pressable>
      {session && <Text style={[s.muted, { marginTop: 8 }]}>✅ Ulangan</Text>}

      <Text style={[s.h2, { marginTop: 28 }]}>Xiaomi / Redmi / Poco uchun muhim</Text>
      <Text style={s.muted}>Eslatma o'z vaqtida kelishi uchun quyidagilarni bajaring:</Text>
      <Text style={s.step}>1. Batareya: "Cheklovsiz" qiling.</Text>
      <Pressable style={s.btn2} onPress={openBatterySettings}><Text>Batareya sozlamasini ochish</Text></Pressable>
      <Text style={s.step}>2. Avtomatik ishga tushirish (Autostart) ni yoqing.</Text>
      <Pressable style={s.btn2} onPress={openPowerManager}><Text>Quvvat boshqaruvini ochish</Text></Pressable>
      <Text style={s.step}>3. Aniq alarm ruxsati.</Text>
      <Pressable style={s.btn2} onPress={openAlarmSettings}><Text>Alarm ruxsatini ochish</Text></Pressable>
      <Text style={s.step}>4. So'nggi ilovalar ro'yxatida ilovani qulflang (kartani pastga tortib 🔒 bosing).</Text>
      <Text style={s.muted}>Shunda ham ilova o'chsa, Telegram bot eslatmani baribir yuboradi.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f7fb' },
  h1: { fontSize: 24, fontWeight: '700', padding: 16, paddingBottom: 4 },
  h2: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#e8e8f0' },
  tabOn: { backgroundColor: '#4f46e5' }, tabT: { color: '#333' }, tabOnT: { color: '#fff', fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginTop: 10 },
  title: { fontSize: 16, fontWeight: '600' }, muted: { color: '#666', marginTop: 2 },
  label: { marginTop: 12, marginBottom: 4, fontWeight: '500' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#ddd' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#e8e8f0' },
  chipOn: { backgroundColor: '#4f46e5' }, chipOnT: { color: '#fff' },
  btn: { backgroundColor: '#4f46e5', padding: 14, borderRadius: 12, marginTop: 20, alignItems: 'center' }, btnT: { color: '#fff', fontWeight: '600' },
  btn2: { backgroundColor: '#e8e8f0', padding: 12, borderRadius: 10, marginTop: 6, alignItems: 'center' },
  step: { marginTop: 12, fontWeight: '500' },
  warn: { backgroundColor: '#fff3cd', margin: 16, marginBottom: 0, padding: 10, borderRadius: 10 }, warnT: { color: '#664d03' },
});
