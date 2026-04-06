import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/auth/auth-provider';
import { addVaultDoc, createShareLink, listVaultDocs, removeVaultDoc, type VaultDoc, type VaultDocType } from '@/src/vault/document-vault';

const TYPES: VaultDocType[] = ['FMB Sketch', 'Patta', 'EC', 'GIS Snapshot'];

export default function ParcelDocsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const parcelId = id ?? 'tn-001';
  const [docs, setDocs] = useState<VaultDoc[]>([]);

  async function refresh() {
    const list = await listVaultDocs(parcelId);
    setDocs(list);
  }
  useEffect(() => {
    refresh();
  }, [parcelId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Document Vault</Text>
      <Text style={styles.subtitle}>Parcel: {parcelId}</Text>

      {user?.role === 'land_consultant' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upload document (FR-44/45)</Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {TYPES.map((t) => (
              <Pressable
                key={t}
                style={styles.btn}
                onPress={async () => {
                  const r = await DocumentPicker.getDocumentAsync({
                    type: ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff'],
                    copyToCacheDirectory: true,
                  });
                  if (r.canceled || !r.assets?.[0]) return;
                  const a = r.assets[0];
                  if ((a.size ?? 0) > 20 * 1024 * 1024) {
                    alert('Max file size is 20MB.');
                    return;
                  }
                  await addVaultDoc({
                    parcelId,
                    type: t,
                    name: a.name,
                    sourceUri: a.uri,
                    mimeType: a.mimeType,
                    size: a.size,
                  });
                  await refresh();
                }}>
                <Text style={styles.btnText}>Upload as {t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Documents ({docs.length})</Text>
        {docs.length === 0 ? <Text style={styles.small}>No docs uploaded yet.</Text> : null}
        {docs.map((d) => (
          <View key={d.id} style={styles.docRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.k}>{d.type}</Text>
              <Text style={styles.small}>{d.name}</Text>
            </View>
            <Pressable
              style={styles.smBtn}
              onPress={() => {
                const s = createShareLink(d);
                alert(`Share link (48h):\n${s.url}\nExpires: ${new Date(s.expiresAt).toLocaleString()}`);
              }}>
              <Text style={styles.btnText}>Share</Text>
            </Pressable>
            {user?.role === 'land_consultant' ? (
              <Pressable
                style={[styles.smBtn, { backgroundColor: '#2B0D1A', borderColor: '#5E1B35' }]}
                onPress={async () => {
                  await removeVaultDoc(d.id);
                  await refresh();
                }}>
                <Text style={[styles.btnText, { color: '#FFC0C2' }]}>Delete</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        <Text style={styles.small}>Landowners can view/download own parcel docs only; upload is consultant-only.</Text>
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
  btn: { backgroundColor: '#0F2147', borderWidth: 1, borderColor: '#203A6E', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  smBtn: { backgroundColor: '#0F2147', borderWidth: 1, borderColor: '#203A6E', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#CFE5F5', fontSize: 12, fontWeight: '900' },
  docRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  k: { color: '#CFE5F5', fontSize: 12, fontWeight: '800' },
  small: { marginTop: 6, color: '#A7B9D6', fontSize: 12, lineHeight: 16 },
});

