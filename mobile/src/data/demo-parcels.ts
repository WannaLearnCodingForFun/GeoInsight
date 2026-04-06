export type Parcel = {
  id: string;
  name: string;
  district: string;
  centroid: { lat: number; lng: number };
  areaAcres: number;
  assignedTo: { name: string; contact: string };
  // Placeholder for where you’ll store GeoJSON/COG URLs fetched at runtime
  ndviSample: number[]; // [-1..1]
};

export const demoParcels: Parcel[] = [
  {
    id: 'tn-001',
    name: 'Parcel TN-001',
    district: 'Chengalpattu',
    centroid: { lat: 12.823, lng: 80.045 },
    areaAcres: 4.6,
    assignedTo: { name: 'Demo Landowner', contact: '+91-90000-00000' },
    ndviSample: [
      0.12, 0.18, 0.22, 0.31, 0.38, 0.41, 0.47, 0.52, 0.58, 0.61, 0.55, 0.49, 0.45, 0.39, 0.33, 0.28,
    ],
  },
  {
    id: 'tn-002',
    name: 'Parcel TN-002',
    district: 'Villupuram',
    centroid: { lat: 11.973, lng: 79.408 },
    areaAcres: 2.2,
    assignedTo: { name: 'Demo Landowner', contact: '+91-90000-00000' },
    ndviSample: [
      0.05, 0.08, 0.1, 0.14, 0.19, 0.24, 0.28, 0.32, 0.36, 0.33, 0.29, 0.26, 0.21, 0.18, 0.14, 0.11,
    ],
  },
];

