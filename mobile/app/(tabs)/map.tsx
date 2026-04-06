import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { computeLandHealthScore } from '@/src/ai/land-health';
import { classifyNdviZones } from '@/src/ai/ndvi-zones';
import { demoParcels } from '@/src/data/demo-parcels';

export default function MapScreen() {
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

  const boundaryGeojson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [parcel.centroid.lng - 0.01, parcel.centroid.lat - 0.008],
                [parcel.centroid.lng + 0.012, parcel.centroid.lat - 0.008],
                [parcel.centroid.lng + 0.012, parcel.centroid.lat + 0.01],
                [parcel.centroid.lng - 0.01, parcel.centroid.lat + 0.01],
                [parcel.centroid.lng - 0.01, parcel.centroid.lat - 0.008],
              ],
            ],
          },
        },
      ],
    }),
    [parcel.centroid.lat, parcel.centroid.lng]
  );

  const html = useMemo(() => {
    // Satellite tiles: Esri World Imagery (no key in hackathon; check terms before production).
    const tileUrl =
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
    <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
    <style>
      html, body { margin:0; padding:0; height:100%; background:#071023; }
      #map { position:absolute; top:0; bottom:0; width:100%; }
      .hud { position:absolute; top:12px; left:12px; right:12px; display:flex; justify-content:space-between; gap:10px; pointer-events:none; }
      .badge { pointer-events:none; display:inline-flex; align-items:center; gap:8px; padding:10px 12px; border-radius:999px; border:1px solid rgba(255,255,255,0.12); background:rgba(11,25,54,0.82); color:#E8F1FF; font-family: -apple-system, system-ui, Segoe UI, Roboto; font-weight:800; font-size:12px; }
      .legend { pointer-events:none; padding:10px 12px; border-radius:14px; border:1px solid rgba(255,255,255,0.12); background:rgba(11,25,54,0.82); color:#A7B9D6; font-family: -apple-system, system-ui, Segoe UI, Roboto; font-size:12px; }
      .row { display:flex; align-items:center; gap:8px; margin-top:6px; }
      .dot { width:10px; height:10px; border-radius:99px; }
      .measure { position:absolute; bottom:12px; left:12px; right:12px; display:flex; gap:10px; }
      .btn { flex:1; border:1px solid rgba(255,255,255,0.14); background:rgba(15,33,71,0.92); color:#CFE5F5; padding:12px; border-radius:14px; font-family: -apple-system, system-ui, Segoe UI, Roboto; font-weight:900; text-align:center; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <div class="hud">
      <div class="badge">Health: ${health.label} • ${health.score}/100</div>
      <div class="legend">
        <div style="font-weight:900; color:#E8F1FF;">Zones</div>
        <div class="row"><span class="dot" style="background:#FF5A5F;"></span> Bare/Stressed ${zones.zones.bare_stressed.pct.toFixed(
          0
        )}%</div>
        <div class="row"><span class="dot" style="background:#FFB020;"></span> Sparse ${zones.zones.sparse.pct.toFixed(
          0
        )}%</div>
        <div class="row"><span class="dot" style="background:#39D98A;"></span> Healthy ${zones.zones.healthy.pct.toFixed(
          0
        )}%</div>
        <div class="row"><span class="dot" style="background:#1B4DFF;"></span> Dense ${zones.zones.dense.pct.toFixed(
          0
        )}%</div>
      </div>
    </div>
    <div class="measure">
      <div class="btn" id="m_point">Point</div>
      <div class="btn" id="m_line">Line</div>
      <div class="btn" id="m_poly">Polygon</div>
      <div class="btn" id="m_clear">Clear</div>
    </div>

    <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
    <script src="https://unpkg.com/@turf/turf@7.3.0/turf.min.js"></script>
    <script>
      const map = new maplibregl.Map({
        container: 'map',
        style: {
          version: 8,
          sources: {
            esri: {
              type: 'raster',
              tiles: ['${tileUrl}'],
              tileSize: 256
            }
          },
          layers: [{ id: 'sat', type: 'raster', source: 'esri' }]
        },
        center: [${parcel.centroid.lng}, ${parcel.centroid.lat}],
        zoom: 14
      });

      const boundary = ${JSON.stringify(boundaryGeojson)};
      const showBoundary = ${showBoundary ? 'true' : 'false'};
      const showZones = ${showZones ? 'true' : 'false'};

      // Boundary overlay (FR-13)
      map.on('load', () => {
        map.addSource('boundary', { type: 'geojson', data: boundary });
        map.addLayer({
          id: 'boundary-line',
          type: 'line',
          source: 'boundary',
          paint: { 'line-color': '#00C2A8', 'line-width': 3 }
        });
        map.addLayer({
          id: 'boundary-fill',
          type: 'fill',
          source: 'boundary',
          paint: { 'fill-color': '#00C2A8', 'fill-opacity': 0.08 }
        });
        if (!showBoundary) {
          map.setLayoutProperty('boundary-line', 'visibility', 'none');
          map.setLayoutProperty('boundary-fill', 'visibility', 'none');
        }

        // Plant health zones overlay (FR-26) — prototype: subdivide boundary bbox into a grid and color by fake NDVI
        const bb = turf.bbox(boundary);
        const grid = turf.squareGrid(bb, 0.15, { units: 'kilometers' });
        grid.features.forEach((f, idx) => {
          const v = ${JSON.stringify(parcel.ndviSample)}[idx % ${parcel.ndviSample.length}];
          f.properties = { ndvi: v };
        });
        map.addSource('zones', { type: 'geojson', data: grid });
        map.addLayer({
          id: 'zones-fill',
          type: 'fill',
          source: 'zones',
          paint: {
            'fill-opacity': 0.35,
            'fill-color': [
              'case',
              ['<', ['get','ndvi'], 0.2], '#FF5A5F',
              ['<', ['get','ndvi'], 0.4], '#FFB020',
              ['<', ['get','ndvi'], 0.6], '#39D98A',
              '#1B4DFF'
            ]
          }
        });
        if (!showZones) map.setLayoutProperty('zones-fill', 'visibility', 'none');
      });

      // Measurement tools (FR-15): point coords, line distance, polygon area
      let mode = null; // 'point' | 'line' | 'poly'
      let coords = [];

      function resetMeasure() {
        coords = [];
        if (map.getSource('measure')) map.removeLayer('measure-line'), map.removeLayer('measure-points'), map.removeSource('measure');
      }

      function renderMeasure() {
        const fc = { type:'FeatureCollection', features: [] };
        coords.forEach((c) => fc.features.push({ type:'Feature', properties:{}, geometry:{ type:'Point', coordinates:c } }));
        if (mode === 'line' && coords.length >= 2) {
          fc.features.push({ type:'Feature', properties:{}, geometry:{ type:'LineString', coordinates: coords } });
        }
        if (mode === 'poly' && coords.length >= 3) {
          const poly = [...coords, coords[0]];
          fc.features.push({ type:'Feature', properties:{}, geometry:{ type:'Polygon', coordinates: [poly] } });
        }
        if (!map.getSource('measure')) {
          map.addSource('measure', { type:'geojson', data: fc });
          map.addLayer({ id:'measure-line', type:'line', source:'measure', filter:['==',['geometry-type'],'LineString'], paint:{ 'line-color':'#E8F1FF','line-width':3 }});
          map.addLayer({ id:'measure-points', type:'circle', source:'measure', filter:['==',['geometry-type'],'Point'], paint:{ 'circle-color':'#E8F1FF','circle-radius':5 }});
        } else {
          map.getSource('measure').setData(fc);
        }

        try {
          if (mode === 'point' && coords.length === 1) {
            const [lng, lat] = coords[0];
            window.ReactNativeWebView?.postMessage(JSON.stringify({ type:'measure', text: \`Point: \${lat.toFixed(6)}, \${lng.toFixed(6)}\` }));
          } else if (mode === 'line' && coords.length >= 2) {
            const line = turf.lineString(coords);
            const km = turf.length(line, { units:'kilometers' });
            window.ReactNativeWebView?.postMessage(JSON.stringify({ type:'measure', text: \`Distance: \${(km*1000).toFixed(1)} m\` }));
          } else if (mode === 'poly' && coords.length >= 3) {
            const poly = turf.polygon([[...coords, coords[0]]]);
            const area = turf.area(poly);
            window.ReactNativeWebView?.postMessage(JSON.stringify({ type:'measure', text: \`Area: \${(area/4046.8564224).toFixed(3)} acres\` }));
          }
        } catch {}
      }

      map.on('click', (e) => {
        if (!mode) return;
        coords.push([e.lngLat.lng, e.lngLat.lat]);
        if (mode === 'point') coords = [coords[coords.length-1]];
        renderMeasure();
      });

      document.getElementById('m_point').onclick = () => { resetMeasure(); mode='point'; window.ReactNativeWebView?.postMessage(JSON.stringify({ type:'measure', text:'Tap map for coordinates' })); };
      document.getElementById('m_line').onclick = () => { resetMeasure(); mode='line'; window.ReactNativeWebView?.postMessage(JSON.stringify({ type:'measure', text:'Tap points to measure distance' })); };
      document.getElementById('m_poly').onclick = () => { resetMeasure(); mode='poly'; window.ReactNativeWebView?.postMessage(JSON.stringify({ type:'measure', text:'Tap 3+ points to measure area' })); };
      document.getElementById('m_clear').onclick = () => { resetMeasure(); mode=null; window.ReactNativeWebView?.postMessage(JSON.stringify({ type:'measure', text:'' })); };
    </script>
  </body>
</html>`;
  }, [boundaryGeojson, health.label, health.score, parcel.centroid.lat, parcel.centroid.lng, parcel.ndviSample, showBoundary, showZones, zones.zones]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={[styles.pill, showBoundary ? styles.pillOn : styles.pillOff]} onPress={() => setShowBoundary((s) => !s)}>
          <Text style={styles.pillText}>Boundary</Text>
        </Pressable>
        <Pressable style={[styles.pill, showZones ? styles.pillOn : styles.pillOff]} onPress={() => setShowZones((s) => !s)}>
          <Text style={styles.pillText}>Zones</Text>
        </Pressable>
      </View>

      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg.type === 'measure' && msg.text) alert(msg.text);
          } catch {}
        }}
      />
      <Text style={styles.hint}>
        FR-11/12/13/14/15/16 implemented as MapLibre satellite + toggles + boundary + measurements + health badge. Raster overlays + offline
        tile downloads are scaffolded next.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071023' },
  topBar: { paddingTop: 56, paddingHorizontal: 12, paddingBottom: 10, flexDirection: 'row', gap: 10 },
  pill: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  pillOn: { backgroundColor: '#1B4DFF', borderColor: '#1B4DFF' },
  pillOff: { backgroundColor: '#0B1936', borderColor: '#1C2E57' },
  pillText: { color: '#E8F1FF', fontWeight: '900' },
  webview: { flex: 1, borderTopWidth: 1, borderTopColor: '#1C2E57' },
  hint: { padding: 10, color: '#A7B9D6', fontSize: 11, lineHeight: 14 },
});

