import notifee, { AndroidImportance, TriggerType, EventType, AuthorizationStatus } from '@notifee/react-native';
import { loadTasks, loadAnswers, saveAnswer } from './storage';
import { upcomingEvents } from './time';
import { sendAnswer } from './api';

const CHANNEL = 'rejam-main';

export async function ensureChannel() {
  return notifee.createChannel({ id: CHANNEL, name: 'Reja eslatmalari', importance: AndroidImportance.HIGH, vibration: true, sound: 'default' });
}

export async function ensurePermission() {
  const s = await notifee.requestPermission();
  return s.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

// Android 12+: aniq alarm ruxsati kerak. false bo'lsa eslatma kechikishi mumkin.
export async function exactAlarmOk() {
  const s = await notifee.getNotificationSettings();
  return s.android.alarm !== 0; // 0 = DISABLED; -1 (Android 11 va eski) = ruxsat shart emas
}
export const openAlarmSettings = () => notifee.openAlarmPermissionSettings();
export const openBatterySettings = () => notifee.openBatteryOptimizationSettings();
export const openPowerManager = () => notifee.openPowerManagerSettings();

function build(ev) {
  const t = ev.task;
  const range = `${t.start}-${t.end}`;
  const base = {
    id: ev.id,
    data: { taskId: String(t.id), date: ev.date, kind: ev.kind },
    android: { channelId: CHANNEL, importance: AndroidImportance.HIGH, pressAction: { id: 'default' }, smallIcon: 'ic_launcher' },
  };
  if (ev.kind === 'remind') return { ...base, title: `⏰ 15 daqiqadan keyin: ${t.title}`, body: range };
  const title = ev.kind === 'ask' ? `✅ ${t.title}: bajardingizmi?` : `🔔 ${t.title} bajarildimi?`;
  return {
    ...base, title, body: `Vaqti tugadi (${range})`,
    android: {
      ...base.android,
      actions: [
        { title: '✅ Ha', pressAction: { id: 'done' } },
        { title: '❌ Yo\'q', pressAction: { id: 'missed' } },
        { title: '⏳ Keyinroq', pressAction: { id: 'later' } },
      ],
    },
  };
}

// Barcha kelajakdagi eslatmalarni qayta rejalashtiradi (ilova ochilganda, vazifa o'zgarganda).
export async function rescheduleAll() {
  await ensureChannel();
  const tasks = await loadTasks();
  const answers = await loadAnswers();
  const answered = new Set(Object.keys(answers));
  await notifee.cancelTriggerNotifications();
  const events = upcomingEvents(tasks, new Date(), 7, answered).slice(0, 400);
  for (const ev of events) {
    await notifee.createTriggerNotification(build(ev), {
      type: TriggerType.TIMESTAMP,
      timestamp: ev.at.getTime(),
      alarmManager: { allowWhileIdle: true }, // Doze rejimida ham aniq vaqtda ishlaydi
    });
  }
  return events.length;
}

export async function snooze(taskId, date, minutes = 10) {
  const tasks = await loadTasks();
  const t = tasks.find((x) => String(x.id) === String(taskId));
  if (!t) return;
  await notifee.createTriggerNotification(
    build({ id: `${taskId}|${date}|later|${Date.now()}`, kind: 'followup', task: t, date }),
    { type: TriggerType.TIMESTAMP, timestamp: Date.now() + minutes * 60000, alarmManager: { allowWhileIdle: true } },
  );
}

export async function handleAnswer(taskId, date, status) {
  if (status === 'later') return snooze(taskId, date);
  await saveAnswer(taskId, date, status);
  await notifee.cancelTriggerNotification(`${taskId}|${date}|ask`).catch(() => {});
  await notifee.cancelTriggerNotification(`${taskId}|${date}|followup`).catch(() => {});
  await sendAnswer(taskId, date, status).catch(() => {});
}

// Foydalanuvchi bildirishnoma tugmasini bosganda (ilova yopiq bo'lsa ham)
export async function onEvent({ type, detail }) {
  if (type !== EventType.ACTION_PRESS) return;
  const { notification, pressAction } = detail;
  const d = notification?.data;
  if (!d || !['done', 'missed', 'later'].includes(pressAction?.id)) return;
  await handleAnswer(d.taskId, d.date, pressAction.id);
  if (notification.id) await notifee.cancelNotification(notification.id).catch(() => {});
}
