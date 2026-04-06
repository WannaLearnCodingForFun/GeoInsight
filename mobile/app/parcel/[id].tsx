import { useEffect, useState } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { computeLandHealthScore } from '@/src/ai/land-health';
import { computeNdviTrend } from '@/src/ai/ndvi-trend';
import { classifyNdviZones } from '@/src/ai/ndvi-zones';
import { estimateValuation } from '@/src/ai/valuation';
import { demoParcels } from '@/src/data/demo-parcels';
import { fetchPlanetaryComputerSTAC, fetchSoilGrids } from '@/src/services/open-apis';

export default function ParcelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const parcel = demoParcels.find((p) => p.id === id) ?? demoParcels[0];

  const ndviCurrent = parcel.ndviSample[parcel.ndviSample.length - 1] ?? 0.3;
  const ndviTwoYearMean = parcel.ndviSample.reduce((s, x) => s + x, 0) / (parcel.ndviSample.length || 1);

  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState({
    rainfallAdequacy: 0.5,
    soilQuality: 0.5,
    temperatureSuitability: 0.5,
  });

  useEffect(() => {
    async function fetchInsights() {
      try {
        const bbox = {
          minLng: parcel.centroid.lng - 0.005,
          minLat: parcel.centroid.lat - 0.005,
          maxLng: parcel.centroid.lng + 0.005,
          maxLat: parcel.centroid.lat + 0.005,
        };

        const [soil, stac] = await Promise.all([
          fetchSoilGrids({ lat: parcel.centroid.lat, lng: parcel.centroid.lng }).catch(() => null),
          fetchPlanetaryComputerSTAC({ bbox }).catch(() => null),
        ]);

        let sq = 0.5;
        if (soil?.properties?.layers) {
          const ph = soil.properties.layers.find((l: any) => l.name === 'phh2o')?.depths?.[0]?.values?.mean ?? 50;
          sq = Math.min(1, Math.max(0.1, ph / 100));
        }

        setSignals({
          soilQuality: sq,
          rainfallAdequacy: stac?.rainfallAdequacy ?? 0.45,
          temperatureSuitability: stac?.temperatureSuitability ?? 0.55,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, [parcel.id]);

  const health = computeLandHealthScore({
    ndviCurrent,
    ndviTwoYearMean,
    rainfallAdequacy: signals.rainfallAdequacy,
    soilQuality: signals.soilQuality,
    temperatureSuitability: signals.temperatureSuitability,
  });

  const zones = classifyNdviZones(parcel.ndviSample);
  const trend = computeNdviTrend({
    currentSeries: parcel.ndviSample,
    previousSeries: parcel.ndviSample.map((v, i) => Math.max(-1, v - (i < 6 ? 0.02 : 0.08))),
  });
  const valuation = estimateValuation({
    landHealthScore: health.score,
    soilQuality: signals.soilQuality,
    rainfallAdequacy: signals.rainfallAdequacy,
    proximityScore: parcel.id === 'tn-001' ? 0.63 : 0.48,
    nightLightIndex: parcel.id === 'tn-001' ? 0.55 : 0.39,
    baseRsPerAcre: 210000,
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{parcel.name}</Text>
      <Text style={styles.meta}>
        {parcel.district} • {parcel.areaAcres.toFixed(1)} acres
      </Text>

      {loading && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
          <ActivityIndicator color="#A7B9D6" size="small" />
          <Text style={styles.small}>Syncing open APIs (STAC/SoilGrids) …</Text>
        </View>
      )}

      <View style={styles.row}>
        <Badge label={`Health: ${health.label}`} tone={health.label} />
        <Badge label={`Score: ${health.score}/100`} tone="neutral" />
      </View>
      <View style={styles.row}>
        <Link href={{ pathname: '/parcel/docs', params: { id: parcel.id } }} style={styles.linkBtn}>
          Document Vault
        </Link>
        <Link href={{ pathname: '/alerts', params: { parcelId: parcel.id } }} style={styles.linkBtn}>
          Alerts & Geofence
        </Link>
        <Link href={{ pathname: '/parcel/tree', params: { id: parcel.id } }} style={styles.linkBtn}>
          Tree Count
        </Link>
      </View>

      <Card title="Land Health Dashboard (AI Module)" subtitle={`Confidence: ${health.confidencePct}%`}>
        <SignalRow label="NDVI (current)" value={ndviCurrent.toFixed(2)} />
        <SignalRow label="NDVI (2-year mean)" value={ndviTwoYearMean.toFixed(2)} />
        <SignalRow label="NDVI status" value={trend.status} />
        <SignalRow label="Trend samples" value={String(trend.monthlyTrend.length)} />
        <SignalRow label="Rainfall adequacy" value={(signals.rainfallAdequacy * 100).toFixed(0) + '%'} />
        <SignalRow label="Soil quality" value={(signals.soilQuality * 100).toFixed(0) + '%'} />
        <SignalRow label="Temperature suitability" value={(signals.temperatureSuitability * 100).toFixed(0) + '%'} />
      </Card>

      <Card title="Plant Health Zone Map (AI Module)" subtitle={`Confidence: ${zones.confidencePct}%`}>
        <ZoneRow label="Bare / Stressed (NDVI < 0.2)" pct={zones.zones.bare_stressed.pct} color="#FF5A5F" />
        <ZoneRow label="Sparse (0.2–0.4)" pct={zones.zones.sparse.pct} color="#FFB020" />
        <ZoneRow label="Healthy (0.4–0.6)" pct={zones.zones.healthy.pct} color="#39D98A" />
        <ZoneRow label="Dense (> 0.6)" pct={zones.zones.dense.pct} color="#1B4DFF" />
        <SignalRow label="Lower-zone increase vs previous survey" value={`${trend.lowerZoneIncreasePct.toFixed(1)}%`} />
      </Card>

      <Card title="Land Valuation (AI Module)" subtitle={`Confidence: ${valuation.confidencePct}%`}>
        <SignalRow label="Estimated Low" value={`Rs. ${(valuation.low / 100000).toFixed(2)}L / acre`} />
        <SignalRow label="Estimated Mid" value={`Rs. ${(valuation.mid / 100000).toFixed(2)}L / acre`} />
        <SignalRow label="Estimated High" value={`Rs. ${(valuation.high / 100000).toFixed(2)}L / acre`} />
        <SignalRow label="Top drivers" value={valuation.topDrivers.join(', ')} />
        <Text style={styles.small}>{valuation.disclaimer}</Text>
      </Card>

      <Card title="GIS Viewer (stub)" subtitle="MapLibre + layers to be wired">
        <Text style={styles.small}>
          Required layers per SRS: Orthomosaic, Boundary, DEM, NDVI, Plant Zones. This prototype currently shows the
          computed AI outputs; next step is rendering these as overlays on MapLibre.
        </Text>
      </Card>
    </ScrollView>
  );
}

function Card(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{props.title}</Text>
      {props.subtitle ? <Text style={styles.cardSubtitle}>{props.subtitle}</Text> : null}
      <View style={{ marginTop: 10, gap: 8 }}>{props.children}</View>
    </View>
  );
}

function SignalRow(props: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.k}>{props.label}</Text>
      <Text style={styles.v}>{props.value}</Text>
    </View>
  );
}

function ZoneRow(props: { label: string; pct: number; color: string }) {
  return (
    <View style={styles.zoneRow}>
      <View style={[styles.dot, { backgroundColor: props.color }]} />
      <Text style={[styles.k, { flex: 1 }]}>{props.label}</Text>
      <Text style={styles.v}>{props.pct.toFixed(0)}%</Text>
    </View>
  );
}

function Badge(props: { label: string; tone: 'Healthy' | 'Moderate' | 'At Risk' | 'neutral' }) {
  const bg =
    props.tone === 'Healthy'
      ? '#163A2B'
      : props.tone === 'Moderate'
        ? '#3B2F16'
        : props.tone === 'At Risk'
          ? '#3A1616'
          : '#14213D';
  const border =
    props.tone === 'Healthy'
      ? '#39D98A'
      : props.tone === 'Moderate'
        ? '#FFB020'
        : props.tone === 'At Risk'
          ? '#FF5A5F'
          : '#2A3F78';
  const fg =
    props.tone === 'Healthy'
      ? '#B9F6D5'
      : props.tone === 'Moderate'
        ? '#FFE3B0'
        : props.tone === 'At Risk'
          ? '#FFC0C2'
          : '#CFE5F5';

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{props.label}</Text>
    </View>
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
    fontSize: 24,
    fontWeight: '900',
  },
  meta: {
    marginTop: 6,
    color: '#A7B9D6',
    fontSize: 12,
  },
  row: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
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
  cardSubtitle: {
    marginTop: 4,
    color: '#A7B9D6',
    fontSize: 12,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  k: {
    color: '#CFE5F5',
    fontSize: 12,
    fontWeight: '700',
  },
  v: {
    color: '#E8F1FF',
    fontSize: 12,
    fontWeight: '900',
  },
  small: {
    color: '#A7B9D6',
    fontSize: 12,
    lineHeight: 16,
  },
  linkBtn: {
    color: '#CFE5F5',
    backgroundColor: '#0F2147',
    borderWidth: 1,
    borderColor: '#203A6E',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '800',
  },
});

