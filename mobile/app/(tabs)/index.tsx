import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/auth/auth-provider';
import { demoParcels } from '@/src/data/demo-parcels';

export default function ParcelsScreen() {
  const { user } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Parcels</Text>
      <Text style={styles.subtitle}>
        {user?.role === 'land_consultant'
          ? 'Admin access: create parcels, upload data, assign landowners (stubbed).'
          : 'Read-only: view assigned parcels (demo shows 2).'}
      </Text>

      {user?.role === 'land_consultant' && (
        <View style={styles.actionsRow}>
          <Link href="/parcel/create" asChild>
            <Pressable style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>+ Create Parcel</Text>
            </Pressable>
          </Link>
          <Pressable style={styles.secondaryBtn} onPress={() => alert('Stub: Upload GeoTIFF/GeoJSON')}>
            <Text style={styles.secondaryBtnText}>Upload Data</Text>
          </Pressable>
        </View>
      )}

      <View style={{ marginTop: 16, gap: 12 }}>
        {demoParcels.map((p) => (
          <Link key={p.id} href={{ pathname: '/parcel/[id]', params: { id: p.id } }} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.cardTitle}>{p.name}</Text>
              <Text style={styles.cardMeta}>
                {p.district} • {p.areaAcres.toFixed(1)} acres
              </Text>
              <Text style={styles.cardMeta}>
                Centroid: {p.centroid.lat.toFixed(3)}, {p.centroid.lng.toFixed(3)}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 56,
    backgroundColor: '#071023',
    minHeight: '100%',
  },
  title: {
    color: '#E8F1FF',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    color: '#A7B9D6',
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#0F2147',
    borderWidth: 1,
    borderColor: '#203A6E',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#CFE5F5',
    fontSize: 14,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#0B1936',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1C2E57',
  },
  cardTitle: {
    color: '#E8F1FF',
    fontSize: 16,
    fontWeight: '800',
  },
  cardMeta: {
    marginTop: 4,
    color: '#A7B9D6',
    fontSize: 12,
  },
});
