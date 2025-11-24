/**
 * Mapbox Static Images API Utility
 * Generates static map thumbnails for route previews in feeds
 * Prevents mobile browser crashes from rendering too many interactive maps
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
const MAPBOX_STYLE = "malunao/cm84u5ecf000x01qled5j8bvl"; // Aurora custom style

export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface StaticMapOptions {
  width?: number;
  height?: number;
  zoom?: number;
  bearing?: number;
  pitch?: number;
  retina?: boolean;
}

/**
 * Generate a static map image URL for a route
 * Uses Mapbox Static Images API with polyline overlay
 */
export function generateRouteStaticImage(
  coordinates: RouteCoordinate[],
  options: StaticMapOptions = {}
): string {
  const {
    width = 400,
    height = 300,
    zoom = 14,
    bearing = 0,
    pitch = 0,
    retina = true,
  } = options;

  if (!coordinates || coordinates.length === 0) {
    throw new Error("Coordinates array cannot be empty");
  }

  // Encode coordinates as polyline for Mapbox API
  const polyline = encodePolyline(coordinates);

  // Calculate center point (middle of route)
  const center = calculateCenter(coordinates);

  // Build overlay string for route line
  // Format: path-{strokeWidth}+{strokeColor}-{opacity}({polyline})
  const overlay = `path-3+2e2ad6-0.8(${polyline})`;

  // Add start and end markers
  const startMarker = `pin-s-a+22c55e(${coordinates[0].lng},${coordinates[0].lat})`;
  const endMarker = `pin-s-b+ef4444(${coordinates[coordinates.length - 1].lng},${coordinates[coordinates.length - 1].lat})`;

  // Construct Static Images API URL
  const retinaStr = retina ? "@2x" : "";
  const url = `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/static/${startMarker},${endMarker},${overlay}/${center.lng},${center.lat},${zoom},${bearing},${pitch}/${width}x${height}${retinaStr}?access_token=${MAPBOX_TOKEN}`;

  return url;
}

/**
 * Generate a static map image URL for a single location marker
 */
export function generateLocationStaticImage(
  location: RouteCoordinate,
  options: StaticMapOptions = {}
): string {
  const {
    width = 400,
    height = 300,
    zoom = 14,
    bearing = 0,
    pitch = 0,
    retina = true,
  } = options;

  // Add marker overlay
  const marker = `pin-s+2e2ad6(${location.lng},${location.lat})`;

  // Construct Static Images API URL
  const retinaStr = retina ? "@2x" : "";
  const url = `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/static/${marker}/${location.lng},${location.lat},${zoom},${bearing},${pitch}/${width}x${height}${retinaStr}?access_token=${MAPBOX_TOKEN}`;

  return url;
}

/**
 * Calculate the center point of a route
 */
function calculateCenter(coordinates: RouteCoordinate[]): RouteCoordinate {
  if (coordinates.length === 0) {
    throw new Error("Cannot calculate center of empty coordinates array");
  }

  if (coordinates.length === 1) {
    return coordinates[0];
  }

  // Calculate bounding box
  let minLat = coordinates[0].lat;
  let maxLat = coordinates[0].lat;
  let minLng = coordinates[0].lng;
  let maxLng = coordinates[0].lng;

  for (const coord of coordinates) {
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
  }

  // Return center of bounding box
  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  };
}

/**
 * Encode coordinates array as polyline string for Mapbox API
 * Uses simplified polyline encoding (precision 5)
 */
function encodePolyline(coordinates: RouteCoordinate[]): string {
  if (coordinates.length === 0) return "";

  let encoded = "";
  let prevLat = 0;
  let prevLng = 0;

  for (const coord of coordinates) {
    // Round to 5 decimal places (precision 5)
    const lat = Math.round(coord.lat * 1e5);
    const lng = Math.round(coord.lng * 1e5);

    // Calculate deltas
    const deltaLat = lat - prevLat;
    const deltaLng = lng - prevLng;

    // Encode deltas
    encoded += encodeValue(deltaLat);
    encoded += encodeValue(deltaLng);

    prevLat = lat;
    prevLng = lng;
  }

  return encoded;
}

/**
 * Encode a single value for polyline
 */
function encodeValue(value: number): string {
  // Apply zigzag encoding
  let encoded = value < 0 ? ~(value << 1) : value << 1;

  let result = "";
  while (encoded >= 0x20) {
    result += String.fromCharCode((0x20 | (encoded & 0x1f)) + 63);
    encoded >>= 5;
  }
  result += String.fromCharCode(encoded + 63);

  return result;
}

/**
 * Calculate optimal zoom level for a route based on bounding box
 */
export function calculateOptimalZoom(
  coordinates: RouteCoordinate[],
  mapWidth: number = 400,
  mapHeight: number = 300
): number {
  if (coordinates.length === 0) return 14;
  if (coordinates.length === 1) return 15;

  // Calculate bounding box
  let minLat = coordinates[0].lat;
  let maxLat = coordinates[0].lat;
  let minLng = coordinates[0].lng;
  let maxLng = coordinates[0].lng;

  for (const coord of coordinates) {
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
  }

  // Calculate deltas
  const latDelta = maxLat - minLat;
  const lngDelta = maxLng - minLng;

  // Calculate zoom based on deltas
  // This is a simplified calculation
  const latZoom = Math.log2(360 / latDelta);
  const lngZoom = Math.log2(360 / lngDelta);

  // Use the smaller zoom to ensure everything fits
  const zoom = Math.min(latZoom, lngZoom);

  // Clamp between 1 and 20, subtract 1 for padding
  return Math.max(1, Math.min(20, Math.floor(zoom) - 1));
}
