import React, { useMemo, useState } from 'react';

import { computeLandHealthScore } from '@/src/ai/land-health';
import { classifyNdviZones } from '@/src/ai/ndvi-zones';
import { demoParcels } from '@/src/data/demo-parcels';

export default function MapWebScreen() {
  const parcel = demoParcels[0]!;
  const [showBoundary, setShowBoundary] = useState(true);
  const [showZones, setShowZones] = useState(true);

  const ndviCurrent = parcel.ndviSample[parcel.ndviSample.length - 1] ?? 0.3;
  const ndviTwoYearMean = parcel.ndviSample.reduce((s, x) => s + x, 0) / (parcel.ndviSample.length || 1);
  const health = computeLandHealthScore({
    ndviCurrent,
    ndviTwoYearMean,
    rainfallAdequacy: 0.55,
    soilQuality: 0.62,
    temperatureSuitability: 0.58,
  });
  const zones = classifyNdviZones(parcel.ndviSample);

  const mapSrc = useMemo(() => {
    const dLat = 0.03;
    const dLng = 0.04;
    const minLat = parcel.centroid.lat - dLat;
    const maxLat = parcel.centroid.lat + dLat;
    const minLng = parcel.centroid.lng - dLng;
    const maxLng = parcel.centroid.lng + dLng;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${parcel.centroid.lat}%2C${parcel.centroid.lng}`;
  }, [parcel.centroid.lat, parcel.centroid.lng]);

  return (
    <div style={styles.container}>
      <div style={styles.topRow}>
        <button onClick={() => setShowBoundary((v) => !v)} style={{ ...styles.pill, ...(showBoundary ? styles.pillOn : styles.pillOff) }}>
          Boundary
        </button>
        <button onClick={() => setShowZones((v) => !v)} style={{ ...styles.pill, ...(showZones ? styles.pillOn : styles.pillOff) }}>
          Zones
        </button>
        <div style={styles.badge}>Health: {health.label} ({health.score}/100)</div>
      </div>

      <div style={styles.mapWrap}>
        <iframe title="LANDROID map" src={mapSrc} style={styles.iframe} />
      </div>

      <div style={styles.legendCard}>
        <div style={styles.legendTitle}>Plant Health Zones</div>
        {showZones ? (
          <>
            <LegendRow color="#FF5A5F" label={`Bare/Stressed ${zones.zones.bare_stressed.pct.toFixed(0)}%`} />
            <LegendRow color="#FFB020" label={`Sparse ${zones.zones.sparse.pct.toFixed(0)}%`} />
            <LegendRow color="#39D98A" label={`Healthy ${zones.zones.healthy.pct.toFixed(0)}%`} />
            <LegendRow color="#1B4DFF" label={`Dense ${zones.zones.dense.pct.toFixed(0)}%`} />
          </>
        ) : (
          <div style={styles.small}>Zone layer hidden.</div>
        )}
        <div style={styles.small}>
          Web fallback map is enabled. Native MapLibre measurements and advanced layers remain in `map.tsx` for Android/iOS.
        </div>
        <div style={styles.small}>
          Boundary toggle: {showBoundary ? 'ON' : 'OFF'} (visual overlay draw is in native MapLibre screen).
        </div>
      </div>
    </div>
  );
}

function LegendRow(props: { color: string; label: string }) {
  return (
    <div style={styles.legendRow}>
      <span style={{ ...styles.dot, backgroundColor: props.color }} />
      <span style={styles.legendText}>{props.label}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#071023',
    color: '#E8F1FF',
    padding: 12,
    boxSizing: 'border-box',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  pill: {
    borderRadius: 999,
    border: '1px solid #1C2E57',
    padding: '8px 12px',
    fontWeight: 800,
    cursor: 'pointer',
    color: '#E8F1FF',
  },
  pillOn: {
    background: '#1B4DFF',
    borderColor: '#1B4DFF',
  },
  pillOff: {
    background: '#0B1936',
  },
  badge: {
    border: '1px solid #2A3F78',
    background: '#14213D',
    padding: '8px 12px',
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12,
  },
  mapWrap: {
    border: '1px solid #1C2E57',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#0B1936',
  },
  iframe: {
    width: '100%',
    height: 420,
    border: 0,
  },
  legendCard: {
    marginTop: 12,
    border: '1px solid #1C2E57',
    borderRadius: 12,
    background: '#0B1936',
    padding: 12,
  },
  legendTitle: {
    fontWeight: 900,
    marginBottom: 6,
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    display: 'inline-block',
  },
  legendText: {
    fontSize: 12,
    color: '#CFE5F5',
  },
  small: {
    marginTop: 8,
    fontSize: 12,
    color: '#A7B9D6',
    lineHeight: 1.4,
  },
};

