/**
 * Google Maps API service for nearby places search, directions, and distance calculations
 */

import {
  LatLng,
  Place,
  DirectionsResponse,
  NearbySearchResponse,
  PlaceType,
  RouteInfo,
  TravelMode,
  TravelRouteInfo,
} from '@/types/maps';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAWjgA1WFrwi38-pDvR-DeWbAoAcfWHuAU';
const GOOGLE_PLACES_API_BASE = 'https://maps.googleapis.com/maps/api';
const BACKEND_URL = 'http://localhost:8016'; // Update with your backend URL

const FALLBACK_SPEEDS_KMH: Record<TravelMode, number> = {
  walking: 5,
  bicycling: 16,
  driving: 35,
  transit: 28,
};

interface PlaceDetails {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string;
  formatted_address: string;
  opening_hours?: {
    open_now: boolean;
  };
  rating?: number;
  formatted_phone_number?: string;
  website?: string;
  photos?: Array<{
    photo_reference: string;
  }>;
  business_status?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
  place_id: string;
}

interface GoogleNearbySearchResult {
  results: PlaceDetails[];
  next_page_token?: string;
  status: string;
}

class GoogleMapsService {
  /**
   * Search for nearby hospitals
   */
  async getNearbyHospitals(location: LatLng, radius: number = 5000): Promise<Place[]> {
    try {
      return await this.searchNearbyPlaces(location, radius, 'hospital');
    } catch (error) {
      console.error('Error fetching nearby hospitals:', error);
      return [];
    }
  }

  /**
   * Search for nearby pharmacies
   */
  async getNearbyPharmacies(location: LatLng, radius: number = 5000): Promise<Place[]> {
    try {
      return await this.searchNearbyPlaces(location, radius, 'pharmacy');
    } catch (error) {
      console.error('Error fetching nearby pharmacies:', error);
      return [];
    }
  }

  /**
   * Generic nearby places search using Google Places API
   */
  private async searchNearbyPlaces(
    location: LatLng,
    radius: number = 5000,
    type: string = 'hospital',
  ): Promise<Place[]> {
    try {
      const url = `${GOOGLE_PLACES_API_BASE}/place/nearbysearch/json`;

      const params = new URLSearchParams({
        location: `${location.latitude},${location.longitude}`,
        radius: radius.toString(),
        type: type,
        key: GOOGLE_MAPS_API_KEY,
      });

      const response = await fetch(`${url}?${params}`);
      const data: GoogleNearbySearchResult = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      const places: Place[] = await Promise.all(
        data.results.map(async (result) => {
          const distance = this.calculateDistance(
            location,
            {
              latitude: result.geometry.location.lat,
              longitude: result.geometry.location.lng,
            },
          );

          let photoUrl: string | undefined;
          if (result.photos && result.photos.length > 0) {
            photoUrl = this.getPhotoUrl(result.photos[0].photo_reference);
          }

          return {
            id: result.place_id,
            name: result.name,
            placeType: (type === 'hospital' ? 'hospital' : 'pharmacy') as PlaceType,
            location: {
              latitude: result.geometry.location.lat,
              longitude: result.geometry.location.lng,
            },
            address: result.formatted_address,
            distance: distance,
            rating: result.rating,
            phoneNumber: result.formatted_phone_number,
            website: result.website,
            photoUrl: photoUrl,
            formattedAddress: result.formatted_address,
            businessStatus: result.business_status,
            openingHours: {
              isOpen: result.opening_hours?.open_now || false,
            },
          };
        }),
      );

      // Sort by distance
      return places.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error in searchNearbyPlaces:', error);
      return [];
    }
  }

  /**
   * Get directions and route information
   */
  async getDirections(
    origin: LatLng,
    destination: LatLng,
    travelMode: TravelMode = 'driving',
  ): Promise<TravelRouteInfo | null> {
    try {
      const url = `${GOOGLE_PLACES_API_BASE}/directions/json`;

      const params = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: travelMode,
        key: GOOGLE_MAPS_API_KEY,
      });

      const response = await fetch(`${url}?${params}`);
      const data: DirectionsResponse = await response.json();

      if (data.status !== 'OK') {
        if (data.status === 'ZERO_RESULTS') {
          return this.buildFallbackRoute(origin, destination, travelMode);
        }

        throw new Error(`Directions API error: ${data.status}`);
      }

      if (data.routes.length === 0) {
        return this.buildFallbackRoute(origin, destination, travelMode);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      if (!leg) {
        return this.buildFallbackRoute(origin, destination, travelMode);
      }

      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
        overview_polyline: route.overview_polyline,
        steps: leg.steps as any,
        travelMode,
      };
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('ZERO_RESULTS'))) {
        console.error('Error getting directions:', error);
      }
      return this.buildFallbackRoute(origin, destination, travelMode);
    }
  }

  /**
   * Get directions for all supported travel modes.
   */
  async getDirectionsForModes(
    origin: LatLng,
    destination: LatLng,
  ): Promise<Record<TravelMode, TravelRouteInfo | null>> {
    const modes: TravelMode[] = ['walking', 'bicycling', 'driving', 'transit'];
    const entries = await Promise.all(
      modes.map(async (mode) => [mode, await this.getDirections(origin, destination, mode)] as const),
    );

    return Object.fromEntries(entries) as Record<TravelMode, TravelRouteInfo | null>;
  }

  /**
   * Provide a fallback route when the Directions API is unavailable.
   */
  private buildFallbackRoute(
    origin: LatLng,
    destination: LatLng,
    travelMode: TravelMode,
  ): TravelRouteInfo {
    const distance = this.calculateDistance(origin, destination);
    const speedKmh = FALLBACK_SPEEDS_KMH[travelMode];
    const durationSeconds = Math.max(1, Math.round((distance / 1000 / speedKmh) * 3600));

    return {
      distance,
      duration: durationSeconds,
      travelMode,
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  calculateDistance(location1: LatLng, location2: LatLng): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(location2.latitude - location1.latitude);
    const dLng = this.toRad(location2.longitude - location1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(location1.latitude)) *
        Math.cos(this.toRad(location2.latitude)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Get photo URL from photo reference
   */
  private getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    return `${GOOGLE_PLACES_API_BASE}/place/photo?photoreference=${photoReference}&maxwidth=${maxWidth}&key=${GOOGLE_MAPS_API_KEY}`;
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Decode polyline points (Google's encoded polyline algorithm)
   */
  decodePolyline(polyline: string): LatLng[] {
    const points: LatLng[] = [];
    let index = 0,
      lat = 0,
      lng = 0;

    while (index < polyline.length) {
      let result = 0;
      let shift = 0;
      let b;

      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      result = 0;
      shift = 0;

      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  }

  /**
   * Get place details
   */
  async getPlaceDetails(placeId: string, placeType: PlaceType = 'hospital'): Promise<Place | null> {
    try {
      const url = `${GOOGLE_PLACES_API_BASE}/place/details/json`;

      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'geometry,name,formatted_address,opening_hours,rating,formatted_phone_number,website,photos,business_status',
        key: GOOGLE_MAPS_API_KEY,
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Place Details API error: ${data.status}`);
      }

      const result = data.result as PlaceDetails;

      let photoUrl: string | undefined;
      if (result.photos && result.photos.length > 0) {
        photoUrl = this.getPhotoUrl(result.photos[0].photo_reference);
      }

      return {
        id: placeId,
        name: result.name,
        placeType,
        location: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
        address: result.formatted_address,
        distance: 0,
        rating: result.rating,
        phoneNumber: result.formatted_phone_number,
        website: result.website,
        photoUrl: photoUrl,
        formattedAddress: result.formatted_address,
        businessStatus: result.business_status,
        openingHours: {
          isOpen: result.opening_hours?.open_now || false,
        },
      };
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }
}

export const googleMapsService = new GoogleMapsService();
