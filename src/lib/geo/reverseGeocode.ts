/**
 * Reverse geocode GPS coordinates to a readable location name using Mapbox.
 * Returns null if Mapbox token is missing or geocoding fails.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return null;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=place,locality,neighborhood&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features?.length > 0) {
      return data.features[0].place_name || data.features[0].text;
    }
  } catch (e) {
    console.error('Reverse geocode failed:', e);
  }
  return null;
}
