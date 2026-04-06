import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { clearTileCache, ensureCacheDir, getTileCacheSizeBytes } from '@/src/cache/tile-cache';

export default function SettingsScreen() {
  const [cacheBytes, setCacheBytes] = useState<number>(0);

  async function refresh() {
    await ensureCacheDir();
    const b = await getTileCacheSizeBytes();
    setCacheBytes(b);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Offline cache and app controls (FR-17 scaffold).</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Offline map tile cache</Text>
        <Text style={styles.small}>Current: {(cacheBytes / (1024 * 1024)).toFixed(1)} MB (prototype counter)</Text>
        <Text style={styles.small}>Limit target: 500 MB. Cache will be tied to “last viewed parcel” tiles.</Text>

        <View style={{ marginTop: 12, gap: 10 }}>
          <Pressable style={styles.btn} onPress={refresh}>
            <Text style={styles.btnText}>Refresh</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, { backgroundColor: '#2B0D1A', borderColor: '#5E1B35' }]}
            onPress={async () => {
              await clearTileCache();
              await refresh();
              alert('Cleared cached map tiles.');
            }}>
            <Text style={[styles.btnText, { color: '#FFC0C2' }]}>Clear cached tiles (FR-17)</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 56, backgroundColor: '#071023', minHeight: '100%' },
  title: { color: '#E8F1FF', fontSize: 26, fontWeight: '900' },
  subtitle: { marginTop: 6, color: '#A7B9D6', fontSize: 13, lineHeight: 18 },
  card: {
    marginTop: 14,
    backgroundColor: '#0B1936',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1C2E57',
  },
  cardTitle: { color: '#E8F1FF', fontSize: 15, fontWeight: '900' },
  btn: {
    backgroundColor: '#0F2147',
    borderWidth: 1,
    borderColor: '#203A6E',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnText: { color: '#CFE5F5', fontSize: 14, fontWeight: '900' },
  small: { marginTop: 8, color: '#A7B9D6', fontSize: 12, lineHeight: 16 },
});

