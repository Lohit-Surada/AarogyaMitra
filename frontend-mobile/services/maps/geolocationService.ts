/**
 * Geolocation service for getting current location and tracking user position
 */

import * as Location from 'expo-location';
import { LocationTrackingState, LatLng } from '@/types/maps';

class GeolocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private foregroundSubscription: Location.LocationSubscription | null = null;

  /**
   * Request location permissions from user
   */
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (foreground.granted) {
        await Location.requestBackgroundPermissionsAsync();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  }

  /**
   * Check if location permissions are granted
   */
  async hasLocationPermissions(): Promise<boolean> {
    try {
      const foreground = await Location.getForegroundPermissionsAsync();
      return foreground.granted;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<LatLng | null> {
    try {
      const hasPermission = await this.hasLocationPermissions();
      if (!hasPermission) {
        const granted = await this.requestLocationPermissions();
        if (!granted) {
          throw new Error('Location permission denied');
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Start watching user location with real-time updates
   */
  startLocationTracking(
    onLocationUpdate: (location: LocationTrackingState) => void,
    onError: (error: Error) => void,
  ): () => void {
    const startWatching = async () => {
      try {
        const hasPermission = await this.hasLocationPermissions();
        if (!hasPermission) {
          throw new Error('Location permission denied');
        }

        this.foregroundSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000, // update every second
            distanceInterval: 1, // minimum 1 meter change
          },
          (location) => {
            onLocationUpdate({
              currentLocation: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              },
              heading: location.coords.heading,
              accuracy: location.coords.accuracy,
            });
          },
        );
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    };

    startWatching();

    // Return cleanup function
    return () => {
      this.stopLocationTracking();
    };
  }

  /**
   * Stop tracking location
   */
  stopLocationTracking(): void {
    if (this.foregroundSubscription) {
      this.foregroundSubscription.remove();
      this.foregroundSubscription = null;
    }
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  /**
   * Get address from coordinates (reverse geocoding)
   */
  async getAddressFromCoordinates(coords: LatLng): Promise<string> {
    try {
      const results = await Location.reverseGeocodeAsync({
        longitude: coords.longitude,
        latitude: coords.latitude,
      });

      if (results.length > 0) {
        const result = results[0];
        const address = [
          result.name,
          result.street,
          result.city,
          result.region,
          result.postalCode,
        ]
          .filter(Boolean)
          .join(', ');
        return address || 'Address not found';
      }
      return 'Address not found';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Error getting address';
    }
  }

  /**
   * Get coordinates from address (geocoding)
   */
  async getCoordinatesFromAddress(address: string): Promise<LatLng | null> {
    try {
      const results = await Location.geocodeAsync(address);
      if (results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }
}

export const geolocationService = new GeolocationService();
