import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { estimateTreeCanopy } from '@/src/ai/tree-canopy';
import { demoParcels } from '@/src/data/demo-parcels';

export default function ParcelTreeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const parcel = demoParcels.find((p) => p.id === id) ?? demoParcels[0]!;
  const canopy = estimateTreeCanopy({ ndviSeries: parcel.ndviSample, areaAcres: parcel.areaAcres });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tree & Canopy Count</Text>
      <Text style={styles.subtitle}>Parcel: {parcel.id}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Output</Text>
        <Row k="Total canopy count" v={String(canopy.totalCanopies)} />
        <Row k="Density per acre" v={`${canopy.densityPerAcre}`} />
        <Row k="Potentially stressed canopies" v={String(canopy.stressedCount)} />
        <Row k="Change vs previous: missing / new" v={`${canopy.changeVsPrevious.missing} / ${canopy.changeVsPrevious.new}`} />
        <Row k="Confidence" v={`${canopy.confidencePct}%`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.small}>
          Prototype note: this uses NDVI-based heuristics as an OpenCV placeholder. Replace with blob/watershed on orthomosaic for final FR-29..33.
        </Text>
      </View>
    </ScrollView>
  );
}

function Row(props: { k: string; v: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.k}>{props.k}</Text>
      <Text style={styles.v}>{props.v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 56, backgroundColor: '#071023', minHeight: '100%' },
  title: { color: '#E8F1FF', fontSize: 24, fontWeight: '900' },
  subtitle: { marginTop: 6, color: '#A7B9D6', fontSize: 12 },
  card: { marginTop: 14, backgroundColor: '#0B1936', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1C2E57' },
  cardTitle: { color: '#E8F1FF', fontSize: 15, fontWeight: '900' },
  row: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  k: { color: '#CFE5F5', fontSize: 12, fontWeight: '700', flex: 1 },
  v: { color: '#E8F1FF', fontSize: 12, fontWeight: '900' },
  small: { color: '#A7B9D6', fontSize: 12, lineHeight: 16 },
});

