/**
 * Maps types and interfaces for Google Maps integration
 */

export type PlaceType = 'hospital' | 'pharmacy' | 'clinic' | 'doctor';
export type TravelMode = 'walking' | 'bicycling' | 'driving' | 'transit';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  name: string;
  placeType: PlaceType;
  location: LatLng;
  address: string;
  distance: number; // in meters
  rating?: number;
  phoneNumber?: string;
  openingHours?: {
    isOpen: boolean;
    hours?: string;
  };
  website?: string;
  photoUrl?: string;
  formattedAddress?: string;
  businessStatus?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  overview_polyline?: {
    points: string;
  };
  steps?: RouteStep[];
}

export interface TravelRouteInfo extends RouteInfo {
  travelMode: TravelMode;
}

export interface RouteStep {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  end_location: LatLng;
  html_instructions: string;
  maneuver?: string;
  polyline: {
    points: string;
  };
  start_location: LatLng;
  travel_mode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
}

export interface NearbySearchResponse {
  results: Place[];
  next_page_token?: string;
  status: 'OK' | 'ZERO_RESULTS' | 'INVALID_REQUEST' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';
}

export interface DirectionsResponse {
  routes: {
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      end_address: string;
      end_location: LatLng;
      start_address: string;
      start_location: LatLng;
      steps: RouteStep[];
    }>;
    overview_polyline: {
      points: string;
    };
    warnings?: string[];
  }[];
  status: 'OK' | 'ZERO_RESULTS' | 'INVALID_REQUEST' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';
}

export interface LocationTrackingState {
  currentLocation: LatLng | null;
  heading: number | null;
  accuracy: number | null;
}

export interface SearchFilters {
  type: PlaceType;
  radius: number; // in meters
  keyword?: string;
}
