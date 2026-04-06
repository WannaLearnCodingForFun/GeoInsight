import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { addAlert, getGeofenceBufferMeters, listAlerts, setGeofenceBufferMeters, type AlertItem } from '@/src/alerts/alerts-store';
import { isOutsideGeofence } from '@/src/alerts/geofence';
import { demoParcels } from '@/src/data/demo-parcels';

export default function AlertsScreen() {
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();
  const parcel = demoParcels.find((p) => p.id === parcelId) ?? demoParcels[0]!;
  const [buffer, setBuffer] = useState('10');
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  async function refresh() {
    const b = await getGeofenceBufferMeters();
    setBuffer(String(b));
    const a = await listAlerts(parcel.id);
    setAlerts(a);
  }

  useEffect(() => {
    refresh();
  }, [parcel.id]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Alerts & Geofence</Text>
      <Text style={styles.subtitle}>Parcel: {parcel.id}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Geofence sensitivity (0–50m)</Text>
        <TextInput value={buffer} onChangeText={setBuffer} keyboardType="number-pad" style={styles.input} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Pressable
            style={styles.btn}
            onPress={async () => {
              await setGeofenceBufferMeters(Number(buffer) || 0);
              await refresh();
              alert('Buffer saved.');
            }}>
            <Text style={styles.btnText}>Save Buffer</Text>
          </Pressable>
          <Pressable
            style={styles.btn}
            onPress={async () => {
              const perm = await Location.requestForegroundPermissionsAsync();
              if (perm.status !== 'granted') {
                alert('Location permission denied.');
                return;
              }
              const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              const result = isOutsideGeofence({
                device: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                centroid: parcel.centroid,
                areaAcres: parcel.areaAcres,
                bufferMeters: Number(buffer) || 0,
              });
              if (result.outside) {
                await addAlert({
                  parcelId: parcel.id,
                  category: 'Boundary Breach',
                  message: `Boundary breach: ${result.distanceMeters.toFixed(1)}m > ${result.thresholdMeters.toFixed(1)}m`,
                });
                alert('Boundary Breach alert logged.');
              } else {
                await addAlert({
                  parcelId: parcel.id,
                  category: 'AI Insight',
                  message: `Inside geofence: ${result.distanceMeters.toFixed(1)}m <= ${result.thresholdMeters.toFixed(1)}m`,
                });
                alert('Inside geofence; insight logged.');
              }
              await refresh();
            }}>
            <Text style={styles.btnText}>Check Current Location</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Alert history (last 90 days)</Text>
        {alerts.length === 0 ? <Text style={styles.small}>No alerts yet.</Text> : null}
        {alerts.map((a) => (
          <View key={a.id} style={styles.alertRow}>
            <Text style={styles.k}>{a.category}</Text>
            <Text style={styles.small}>{a.message}</Text>
            <Text style={styles.small}>{new Date(a.createdAt).toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 56, backgroundColor: '#071023', minHeight: '100%' },
  title: { color: '#E8F1FF', fontSize: 24, fontWeight: '900' },
  subtitle: { marginTop: 6, color: '#A7B9D6', fontSize: 12 },
  card: { marginTop: 14, backgroundColor: '#0B1936', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1C2E57' },
  cardTitle: { color: '#E8F1FF', fontSize: 15, fontWeight: '900' },
  input: {
    marginTop: 8,
    backgroundColor: '#071023',
    color: '#E8F1FF',
    borderWidth: 1,
    borderColor: '#203A6E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btn: { flex: 1, backgroundColor: '#0F2147', borderWidth: 1, borderColor: '#203A6E', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#CFE5F5', fontSize: 12, fontWeight: '900' },
  alertRow: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#1C2E57', paddingTop: 8 },
  k: { color: '#CFE5F5', fontSize: 12, fontWeight: '800' },
  small: { marginTop: 4, color: '#A7B9D6', fontSize: 12, lineHeight: 16 },
});

