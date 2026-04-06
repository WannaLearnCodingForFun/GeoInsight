export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

export function isOutsideGeofence(params: {
  device: { lat: number; lng: number };
  centroid: { lat: number; lng: number };
  areaAcres: number;
  bufferMeters: number;
}) {
  // Approximate parcel as equivalent-area circle around centroid for prototype.
  const areaM2 = params.areaAcres * 4046.8564224;
  const radius = Math.sqrt(areaM2 / Math.PI);
  const dist = haversineMeters(params.device, params.centroid);
  const threshold = radius + params.bufferMeters;
  return { outside: dist > threshold, distanceMeters: dist, thresholdMeters: threshold };
}

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

