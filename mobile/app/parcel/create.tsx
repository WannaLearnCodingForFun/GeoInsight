import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useApiClient } from '@/src/api/client';
import { useAuth } from '@/src/auth/auth-provider';
import type { BoundaryGeoJSON } from '@/src/geo/boundary';
import { deriveCentroidAndBbox } from '@/src/geo/boundary';
import {
  fetchNominatimReverse,
  fetchOverpassProximity,
  fetchPlanetaryComputerStub,
  fetchSoilGrids,
} from '@/src/services/open-apis';

type PickedFile = { name: string; uri: string; mimeType?: string | null; size?: number | null };

export default function CreateParcelScreen() {
  const { user } = useAuth();
  const api = useApiClient();

  const [name, setName] = useState('');
  const [assignedTo, setAssignedTo] = useState(''); // phone or email
  const [boundaryFile, setBoundaryFile] = useState<PickedFile | null>(null);
  const [orthomosaic, setOrtho] = useState<PickedFile | null>(null);
  const [dem, setDem] = useState<PickedFile | null>(null);
  const [ndvi, setNdvi] = useState<PickedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const canSubmit = useMemo(
    () => !!name.trim() && !!assignedTo.trim() && !!boundaryFile && !!orthomosaic && !!dem && !!ndvi && !busy,
    [name, assignedTo, boundaryFile, orthomosaic, dem, ndvi, busy]
  );

  if (user?.role !== 'land_consultant') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Not allowed</Text>
        <Text style={styles.subtitle}>Only Land Consultants can create parcels (FR-06..FR-10).</Text>
      </View>
    );
  }

  const log = (msg: string) => setLogs((prev) => [msg, ...prev].slice(0, 30));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Parcel</Text>
      <Text style={styles.subtitle}>
        Upload boundary + rasters, derive centroid/bbox, then fetch open-API signals in parallel.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Parcel name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g., TN-003" style={styles.input} />

        <Text style={[styles.label, { marginTop: 12 }]}>Assign to Landowner (phone/email)</Text>
        <TextInput value={assignedTo} onChangeText={setAssignedTo} placeholder="+91... or email" style={styles.input} />

        <FileRow label="Boundary (GeoJSON)" file={boundaryFile} onPick={async () => setBoundaryFile(await pick('application/geo+json'))} />
        <FileRow label="Orthomosaic (GeoTIFF)" file={orthomosaic} onPick={async () => setOrtho(await pick('*/*'))} />
        <FileRow label="DEM (GeoTIFF)" file={dem} onPick={async () => setDem(await pick('*/*'))} />
        <FileRow label="NDVI raster (GeoTIFF)" file={ndvi} onPick={async () => setNdvi(await pick('*/*'))} />

        <Pressable
          accessibilityRole="button"
          disabled={!canSubmit}
          style={[styles.primaryBtn, !canSubmit && styles.disabled]}
          onPress={async () => {
            setBusy(true);
            setLogs([]);
            try {
              log('Reading boundary GeoJSON…');
              const boundaryText = await FileSystem.readAsStringAsync(boundaryFile!.uri);
              const boundary = JSON.parse(boundaryText) as BoundaryGeoJSON;

              log('Deriving centroid + bbox (FR-08)…');
              const derived = deriveCentroidAndBbox(boundary);

              log('Fetching open APIs in parallel (FR-09)…');
              const [nominatim, soil, overpass, pc] = await Promise.all([
                fetchNominatimReverse(derived.centroid),
                fetchSoilGrids(derived.centroid),
                fetchOverpassProximity({ bbox: derived.bbox }),
                fetchPlanetaryComputerStub(),
              ]);

              log('Posting parcel to backend (protected) …');
              const resp = await api.request<{ ok: true; parcel: any }>('/parcel', {
                method: 'POST',
                body: JSON.stringify({
                  name: name.trim(),
                  assignedTo: assignedTo.trim(),
                  boundaryGeojson: boundary,
                  centroid: derived.centroid,
                  bbox: derived.bbox,
                  uploads: {
                    orthomosaic: fileMeta(orthomosaic!),
                    dem: fileMeta(dem!),
                    ndvi: fileMeta(ndvi!),
                  },
                  signals: { nominatim, soil, overpass, planetaryComputer: pc },
                }),
              });

              log('Created parcel OK.');
              alert('Parcel created (prototype).');
              router.replace(`/parcel/${resp.parcel.id}`);
            } catch (e: any) {
              alert(e?.message ?? 'Create parcel failed');
              log(`ERROR: ${e?.message ?? String(e)}`);
            } finally {
              setBusy(false);
            }
          }}>
          <Text style={styles.primaryBtnText}>{busy ? 'Working…' : 'Create Parcel'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Run log</Text>
        {logs.length === 0 ? <Text style={styles.small}>No actions yet.</Text> : null}
        {logs.map((l, idx) => (
          <Text key={idx} style={styles.small}>
            {l}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

function fileMeta(f: PickedFile) {
  return { name: f.name, uri: f.uri, mimeType: f.mimeType, size: f.size };
}

async function pick(mimeType: string): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: mimeType,
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled) return null;
  const a = res.assets?.[0];
  if (!a) return null;
  return { name: a.name, uri: a.uri, mimeType: a.mimeType, size: a.size };
}

function FileRow(props: { label: string; file: PickedFile | null; onPick: () => Promise<void> }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.label}>{props.label}</Text>
      <View style={styles.fileRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fileName} numberOfLines={1}>
            {props.file ? props.file.name : 'Not selected'}
          </Text>
        </View>
        <Pressable style={styles.secondaryBtn} onPress={props.onPick}>
          <Text style={styles.secondaryBtnText}>{props.file ? 'Change' : 'Pick'}</Text>
        </Pressable>
      </View>
    </View>
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
  label: { color: '#CFE5F5', fontSize: 13, fontWeight: '800' },
  input: {
    marginTop: 8,
    backgroundColor: '#071023',
    color: '#E8F1FF',
    borderWidth: 1,
    borderColor: '#203A6E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  fileRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fileName: { color: '#A7B9D6', fontSize: 12 },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: '#00C2A8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#06211D', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  secondaryBtn: {
    backgroundColor: '#0F2147',
    borderWidth: 1,
    borderColor: '#203A6E',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  secondaryBtnText: { color: '#CFE5F5', fontWeight: '900' },
  small: { marginTop: 8, color: '#A7B9D6', fontSize: 12, lineHeight: 16 },
});

