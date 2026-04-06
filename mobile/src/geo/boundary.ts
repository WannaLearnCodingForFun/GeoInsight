import centroid from '@turf/centroid';
import bbox from '@turf/bbox';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

export type BoundaryGeoJSON = FeatureCollection | Feature;

export function deriveCentroidAndBbox(boundary: BoundaryGeoJSON): {
  centroid: { lat: number; lng: number };
  bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number };
} {
  const feature: Feature<Geometry> =
    (boundary as FeatureCollection).type === 'FeatureCollection'
      ? ((boundary as FeatureCollection).features?.[0] as Feature<Geometry>)
      : (boundary as Feature<Geometry>);

  const c = centroid(feature);
  const [minLng, minLat, maxLng, maxLat] = bbox(feature);
  return {
    centroid: { lng: c.geometry.coordinates[0], lat: c.geometry.coordinates[1] },
    bbox: { minLng, minLat, maxLng, maxLat },
  };
}

