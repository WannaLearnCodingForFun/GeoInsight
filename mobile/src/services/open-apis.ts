export async function fetchNominatimReverse(params: { lat: number; lng: number }) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(params.lat));
  url.searchParams.set('lon', String(params.lng));

  const res = await fetch(url.toString(), {
    headers: {
      // Nominatim usage policy expects identifying UA; browsers may override. This is best-effort.
      'accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Nominatim reverse failed (${res.status})`);
  return (await res.json()) as any;
}

export async function fetchSoilGrids(params: { lat: number; lng: number }) {
  const url = new URL('https://rest.isric.org/soilgrids/v2.0/properties/query');
  url.searchParams.set('lat', String(params.lat));
  url.searchParams.set('lon', String(params.lng));
  url.searchParams.set('property', 'phh2o');
  url.searchParams.set('property', 'soc');
  url.searchParams.set('property', 'clay');
  url.searchParams.set('property', 'sand');
  url.searchParams.set('depth', '0-5cm');
  url.searchParams.set('value', 'mean');

  const res = await fetch(url.toString(), { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`SoilGrids failed (${res.status})`);
  return (await res.json()) as any;
}

export async function fetchOverpassProximity(params: {
  bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number };
}) {
  // Minimal Overpass query: fetch roads/water/towns in bbox (hackathon prototype)
  const { minLat, minLng, maxLat, maxLng } = params.bbox;
  const query = `
    [out:json][timeout:25];
    (
      way["highway"](${minLat},${minLng},${maxLat},${maxLng});
      way["waterway"](${minLat},${minLng},${maxLat},${maxLng});
      relation["boundary"="administrative"](${minLat},${minLng},${maxLat},${maxLng});
    );
    out center 30;
  `;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'content-type': 'text/plain', accept: 'application/json' },
    body: query,
  });
  if (!res.ok) throw new Error(`Overpass failed (${res.status})`);
  return (await res.json()) as any;
}

export async function fetchPlanetaryComputerSTAC(params: {
  bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number };
}) {
  const url = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
  const bbox = [params.bbox.minLng, params.bbox.minLat, params.bbox.maxLng, params.bbox.maxLat];

  // For Hackathon prototype (FR-18..FR-20), we query the STAC API to verify availability
  // pixel-level extraction of Zarr/GeoTIFF should happen on the backend, so we simulate the extraction score
  // based on the STAC metadata.
  try {
    const fetchStac = async (collections: string[]) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ collections, bbox, limit: 1 }),
      });
      if (!res.ok) return null;
      return res.json();
    };

    const [sentinel, chirps, era5] = await Promise.all([
      fetchStac(['sentinel-2-l2a']),
      fetchStac(['chirps-daily']),
      fetchStac(['era5-pds']),
    ]);

    return {
      sentinelAvailable: !!sentinel?.features?.length,
      chirpsAvailable: !!chirps?.features?.length,
      era5Available: !!era5?.features?.length,
      // Synthetic pixel extraction scores based on STAC availability for demo fallback
      rainfallAdequacy: chirps?.features?.length ? 0.72 : 0.42,
      temperatureSuitability: era5?.features?.length ? 0.68 : 0.51,
    };
  } catch (e) {
    console.error('STAC fetch failed', e);
    return {
      sentinelAvailable: false,
      chirpsAvailable: false,
      era5Available: false,
      rainfallAdequacy: 0.5,
      temperatureSuitability: 0.5,
    };
  }
}


