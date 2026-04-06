import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/auth/auth-provider';
import { useApiClient } from '@/src/api/client';

export default function DashboardOrAdminScreen() {
  const { user, signOut } = useAuth();
  const api = useApiClient();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{user?.role === 'land_consultant' ? 'Admin' : 'Dashboard'}</Text>
      <Text style={styles.subtitle}>
        {user?.role === 'land_consultant'
          ? 'Consultant-only flows: parcel creation, boundary draw, uploads, assignments.'
          : 'Landowner view: health badge, AI outputs, reports, alerts (stubbed).'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick actions</Text>
        <View style={{ marginTop: 12, gap: 10 }}>
          {user?.role === 'land_consultant' ? (
            <>
              <Pressable
                style={styles.btn}
                onPress={async () => {
                  try {
                    const r = await api.request<{ ok: true; bearerTokenPresent: true }>('/me');
                    alert(`API OK: bearer token attached = ${r.bearerTokenPresent}`);
                  } catch (e: any) {
                    alert(`API failed (${e?.status ?? 'err'}): ${e?.bodyText ?? e?.message ?? 'unknown'}`);
                  }
                }}>
                <Text style={styles.btnText}>Test Protected API (FR-05)</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={() => alert('Stub: Draw/confirm boundary')}>
                <Text style={styles.btnText}>Draw / Confirm Boundary</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={() => alert('Stub: Assign parcel to Landowner')}>
                <Text style={styles.btnText}>Assign Parcel to Landowner</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={() => router.push('/alerts?parcelId=tn-001')}>
                <Text style={styles.btnText}>Open Alerts & Geofence</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={() => router.push('/parcel/docs?id=tn-001')}>
                <Text style={styles.btnText}>Open Document Vault</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={styles.btn}
                onPress={async () => {
                  try {
                    const r = await api.request<{ ok: true; bearerTokenPresent: true }>('/me');
                    alert(`API OK: bearer token attached = ${r.bearerTokenPresent}`);
                  } catch (e: any) {
                    alert(`API failed (${e?.status ?? 'err'}): ${e?.bodyText ?? e?.message ?? 'unknown'}`);
                  }
                }}>
                <Text style={styles.btnText}>Test Protected API (FR-05)</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={() => router.push('/parcel/tn-001')}>
                <Text style={styles.btnText}>Open Parcel Dashboard (Demo)</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={() => alert('Stub: Generate GIS snapshot report')}>
                <Text style={styles.btnText}>Generate GIS Snapshot (Stub)</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={() => router.push('/alerts?parcelId=tn-001')}>
                <Text style={styles.btnText}>Open Alerts & Geofence</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={() => router.push('/parcel/docs?id=tn-001')}>
                <Text style={styles.btnText}>Open Document Vault</Text>
              </Pressable>
            </>
          )}
          <Pressable
            style={[styles.btn, { backgroundColor: '#2B0D1A', borderColor: '#5E1B35' }]}
            onPress={() => {
              signOut();
              router.replace('/(auth)');
            }}>
            <Text style={[styles.btnText, { color: '#FFC0C2' }]}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>SRS checklist (what’s wired vs stubbed)</Text>
        <Text style={styles.small}>
          Wired now: role selection + access separation, parcels list, parcel AI outputs with confidence.
        </Text>
        <Text style={styles.small}>
          Next to wire: MapLibre GIS viewer + layer toggles, SoilGrids/PlanetaryComputer API calls, document vault.
        </Text>
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
  card: {
    marginTop: 14,
    backgroundColor: '#0B1936',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1C2E57',
  },
  cardTitle: {
    color: '#E8F1FF',
    fontSize: 15,
    fontWeight: '900',
  },
  btn: {
    backgroundColor: '#0F2147',
    borderWidth: 1,
    borderColor: '#203A6E',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#CFE5F5',
    fontSize: 14,
    fontWeight: '800',
  },
  small: {
    marginTop: 8,
    color: '#A7B9D6',
    fontSize: 12,
    lineHeight: 16,
  },
});
