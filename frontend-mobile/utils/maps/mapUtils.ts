/**
 * Utility functions for maps
 */

import { LatLng, Place } from '@/types/maps';

/**
 * Calculate bounding box for a set of locations
 */
export function calculateBoundingBox(locations: LatLng[]) {
  if (locations.length === 0) {
    return null;
  }

  let minLat = locations[0].latitude;
  let maxLat = locations[0].latitude;
  let minLng = locations[0].longitude;
  let maxLng = locations[0].longitude;

  for (const location of locations) {
    minLat = Math.min(minLat, location.latitude);
    maxLat = Math.max(maxLat, location.latitude);
    minLng = Math.min(minLng, location.longitude);
    maxLng = Math.max(maxLng, location.longitude);
  }

  return {
    northEast: { latitude: maxLat, longitude: maxLng },
    southWest: { latitude: minLat, longitude: minLng },
  };
}

/**
 * Filter places by distance
 */
export function filterPlacesByDistance(places: Place[], maxDistance: number): Place[] {
  return places.filter((place) => place.distance <= maxDistance);
}

/**
 * Sort places by distance
 */
export function sortPlacesByDistance(places: Place[]): Place[] {
  return [...places].sort((a, b) => a.distance - b.distance);
}

/**
 * Sort places by rating
 */
export function sortPlacesByRating(places: Place[]): Place[] {
  return [...places].sort((a, b) => (b.rating || 0) - (a.rating || 0));
}

/**
 * Filter open places
 */
export function filterOpenPlaces(places: Place[]): Place[] {
  return places.filter((place) => place.openingHours?.isOpen);
}

/**
 * Get marker color based on place type
 */
export function getMarkerColor(placeType: string): string {
  switch (placeType) {
    case 'hospital':
      return '#e74c3c'; // Red for hospitals
    case 'pharmacy':
      return '#3498db'; // Blue for pharmacies
    case 'clinic':
      return '#f39c12'; // Orange for clinics
    case 'doctor':
      return '#9b59b6'; // Purple for doctors
    default:
      return '#95a5a6'; // Gray default
  }
}

/**
 * Get marker icon/symbol based on place type
 */
export function getMarkerSymbol(placeType: string): string {
  switch (placeType) {
    case 'hospital':
      return '❤️'; // Heart for hospitals
    case 'pharmacy':
      return '➕'; // Plus for pharmacies
    case 'clinic':
      return '⚕️'; // Medical symbol for clinics
    case 'doctor':
      return '👨‍⚕️'; // Doctor for doctors
    default:
      return '📍'; // Pin default
  }
}

/**
 * Format place information for display
 */
export function formatPlaceInfo(place: Place): string {
  const distanceText = `${(place.distance / 1000).toFixed(1)} km`;
  const ratingText = place.rating ? ` • ${place.rating.toFixed(1)}★` : '';
  return `${place.name} • ${distanceText}${ratingText}`;
}

/**
 * Group places by type
 */
export function groupPlacesByType(places: Place[]) {
  return places.reduce(
    (acc, place) => {
      if (!acc[place.placeType]) {
        acc[place.placeType] = [];
      }
      acc[place.placeType].push(place);
      return acc;
    },
    {} as Record<string, Place[]>,
  );
}

/**
 * Create a region for map display
 */
export function createRegionFromCoordinates(
  coord: LatLng,
  radiusDelta: number = 0.05,
): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  return {
    latitude: coord.latitude,
    longitude: coord.longitude,
    latitudeDelta: radiusDelta,
    longitudeDelta: radiusDelta,
  };
}

/**
 * Create a region that fits all locations
 */
export function createRegionFromLocations(
  locations: LatLng[],
  padding: number = 0.1,
): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  if (locations.length === 0) {
    return {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 1,
      longitudeDelta: 1,
    };
  }

  if (locations.length === 1) {
    return createRegionFromCoordinates(locations[0]);
  }

  const bbox = calculateBoundingBox(locations);
  if (!bbox) {
    return createRegionFromCoordinates(locations[0]);
  }

  const center = {
    latitude: (bbox.northEast.latitude + bbox.southWest.latitude) / 2,
    longitude: (bbox.northEast.longitude + bbox.southWest.longitude) / 2,
  };

  const latitudeDelta = (bbox.northEast.latitude - bbox.southWest.latitude) * (1 + padding);
  const longitudeDelta = (bbox.northEast.longitude - bbox.southWest.longitude) * (1 + padding);

  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: Math.max(latitudeDelta, 0.1),
    longitudeDelta: Math.max(longitudeDelta, 0.1),
  };
}

/**
 * Check if location is within bounds
 */
export function isLocationWithinBounds(
  location: LatLng,
  bounds: ReturnType<typeof calculateBoundingBox>,
): boolean {
  if (!bounds) return false;

  return (
    location.latitude >= bounds.southWest.latitude &&
    location.latitude <= bounds.northEast.latitude &&
    location.longitude >= bounds.southWest.longitude &&
    location.longitude <= bounds.northEast.longitude
  );
}
