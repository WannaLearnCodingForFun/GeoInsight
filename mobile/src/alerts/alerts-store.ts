import * as SecureStore from 'expo-secure-store';

export type AlertCategory = 'Boundary Breach' | 'Plant Health Change' | 'AI Insight';
export type AlertItem = {
  id: string;
  parcelId: string;
  category: AlertCategory;
  message: string;
  createdAt: string;
};

const KEY = 'landroid_alerts_v1';
const BUFFER_KEY = 'landroid_geofence_buffer_m_v1';

export async function getGeofenceBufferMeters() {
  const raw = await SecureStore.getItemAsync(BUFFER_KEY);
  const n = raw ? Number(raw) : 10;
  if (Number.isNaN(n)) return 10;
  return Math.max(0, Math.min(50, n));
}

export async function setGeofenceBufferMeters(m: number) {
  const clamped = Math.max(0, Math.min(50, Math.round(m)));
  await SecureStore.setItemAsync(BUFFER_KEY, String(clamped));
}

export async function listAlerts(parcelId: string) {
  const raw = await SecureStore.getItemAsync(KEY);
  const all: AlertItem[] = raw ? JSON.parse(raw) : [];
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  return all.filter((a) => a.parcelId === parcelId && new Date(a.createdAt).getTime() >= cutoff);
}

export async function addAlert(input: Omit<AlertItem, 'id' | 'createdAt'>) {
  const raw = await SecureStore.getItemAsync(KEY);
  const all: AlertItem[] = raw ? JSON.parse(raw) : [];
  const item: AlertItem = {
    id: `alert_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    ...input,
  };
  all.unshift(item);
  await SecureStore.setItemAsync(KEY, JSON.stringify(all.slice(0, 500)));
  return item;
}

