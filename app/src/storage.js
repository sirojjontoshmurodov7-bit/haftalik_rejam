import AsyncStorage from '@react-native-async-storage/async-storage';

const K = { tasks: 'tasks.v1', session: 'session.v1', answers: 'answers.v1', pending: 'pending.v1', ops: 'ops.v1' };

async function get(key, fallback) {
  try { const v = await AsyncStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
const set = (key, v) => AsyncStorage.setItem(key, JSON.stringify(v));

export const loadTasks = () => get(K.tasks, []);
export const saveTasks = (t) => set(K.tasks, t);
export const loadSession = () => get(K.session, null); // {apiUrl,userId,secret}
export const saveSession = (s) => set(K.session, s);

// answers: { "taskId|date": "done"|"missed" }
export const loadAnswers = () => get(K.answers, {});
export async function saveAnswer(taskId, date, status) {
  const a = await loadAnswers();
  a[`${taskId}|${date}`] = status;
  await set(K.answers, a);
}

export async function mergeAnswers(logs) {
  const a = await loadAnswers();
  for (const l of logs) a[`${l.task_id}|${l.date}`] = l.status;
  await set(K.answers, a);
}

// Internet bo'lmaganda yuborilmagan javoblar navbati
export const loadPending = () => get(K.pending, []);
export const savePending = (p) => set(K.pending, p);

// Yuborilmagan vazifa amallari: {op:'add', task} yoki {op:'del', id}
export const loadOps = () => get(K.ops, []);
export const saveOps = (o) => set(K.ops, o);
