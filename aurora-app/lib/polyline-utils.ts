/**
 * Polyline encoding utilities for route compression
 */

// @ts-ignore - no types available
import polyline from "@mapbox/polyline";

export interface Coordinate {
  lat: number;
  lng: number;
  timestamp?: number;
  elevation?: number;
}

/**
 * Encode coordinates to polyline string for efficient storage
 */
export function encodeCoordinates(coordinates: Coordinate[]): string {
  const points = coordinates.map(coord => [coord.lat, coord.lng]);
  return polyline.encode(points);
}

/**
 * Decode polyline string back to coordinates
 */
export function decodeCoordinates(encoded: string): Coordinate[] {
  const points = polyline.decode(encoded);
  return points.map(([lat, lng]: [number, number]) => ({
    lat,
    lng,
    timestamp: Date.now(), // Placeholder timestamp
  }));
}

/**
 * Calculate compression ratio
 */
export function getCompressionRatio(original: Coordinate[], encoded: string): number {
  const originalSize = JSON.stringify(original).length;
  const encodedSize = encoded.length;
  return ((originalSize - encodedSize) / originalSize) * 100;
}

/**
 * Simplify route by removing redundant points (Douglas-Peucker algorithm)
 */
export function simplifyRoute(coordinates: Coordinate[], tolerance: number = 0.00001): Coordinate[] {
  if (coordinates.length <= 2) return coordinates;

  // Find the point with maximum distance from line segment
  let maxDistance = 0;
  let maxIndex = 0;
  const start = coordinates[0];
  const end = coordinates[coordinates.length - 1];

  for (let i = 1; i < coordinates.length - 1; i++) {
    const distance = perpendicularDistance(coordinates[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyRoute(coordinates.slice(0, maxIndex + 1), tolerance);
    const right = simplifyRoute(coordinates.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  } else {
    return [start, end];
  }
}

/**
 * Calculate perpendicular distance from point to line segment
 */
function perpendicularDistance(
  point: Coordinate,
  lineStart: Coordinate,
  lineEnd: Coordinate
): number {
  const x = point.lat;
  const y = point.lng;
  const x1 = lineStart.lat;
  const y1 = lineStart.lng;
  const x2 = lineEnd.lat;
  const y2 = lineEnd.lng;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Batch compress coordinates for storage
 */
export function compressRoute(coordinates: Coordinate[]): {
  encoded: string;
  timestamps: number[];
  elevations: (number | undefined)[];
} {
  const simplified = simplifyRoute(coordinates, 0.00001);
  const encoded = encodeCoordinates(simplified);
  const timestamps = simplified.map(c => c.timestamp || Date.now());
  const elevations = simplified.map(c => c.elevation);

  return { encoded, timestamps, elevations };
}

/**
 * Decompress route from storage
 */
export function decompressRoute(
  encoded: string,
  timestamps: number[],
  elevations: (number | undefined)[]
): Coordinate[] {
  const coords = decodeCoordinates(encoded);
  return coords.map((coord, i) => ({
    ...coord,
    timestamp: timestamps[i] || Date.now(),
    elevation: elevations[i],
  }));
}
