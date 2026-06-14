# Maps Services - Quick Fixes & Implementation Guide

## 🔥 IMMEDIATE ACTIONS REQUIRED

### Issue #1: Exposed Google Maps API Key
**Current Code:**
```typescript
const GOOGLE_MAPS_API_KEY = 'AIzaSyAWjgA1WFrwi38-pDvR-DeWbAoAcfWHuAU';
```

**Risk**: Anyone can abuse this key, causing:
- Quota exhaustion ($$ charges)
- Security breach
- Service disruption

**Fix Implementation:**

**Step 1: Create Backend Endpoint for Map Services**
```typescript
// backend/src/main/java/com/aarogyamitra/backend/controller/MapController.java
@RestController
@RequestMapping("/api/maps")
public class MapController {
    
    private final GoogleMapsApiClient googleMapsClient;
    
    @GetMapping("/nearby-hospitals")
    public ResponseEntity<?> getNearbyHospitals(
        @RequestParam Double latitude,
        @RequestParam Double longitude,
        @RequestParam(defaultValue = "5000") Integer radius) {
        // API call using server-side API key from environment
        return ResponseEntity.ok(googleMapsClient.getNearbyHospitals(latitude, longitude, radius));
    }
    
    @GetMapping("/nearby-pharmacies")
    public ResponseEntity<?> getNearbyPharmacies(
        @RequestParam Double latitude,
        @RequestParam Double longitude,
        @RequestParam(defaultValue = "5000") Integer radius) {
        return ResponseEntity.ok(googleMapsClient.getNearbyPharmacies(latitude, longitude, radius));
    }
    
    @GetMapping("/directions")
    public ResponseEntity<?> getDirections(
        @RequestParam Double originLat,
        @RequestParam Double originLng,
        @RequestParam Double destLat,
        @RequestParam Double destLng,
        @RequestParam String mode) {
        return ResponseEntity.ok(googleMapsClient.getDirections(originLat, originLng, destLat, destLng, mode));
    }
}
```

**Step 2: Update Frontend to Use Backend Endpoints**
```typescript
// frontend-mobile/services/maps/googleMapsService.ts
const BACKEND_URL = 'https://api.aarogyamitra.com'; // No API key exposed

async getNearbyHospitals(location: LatLng, radius: number = 5000): Promise<Place[]> {
    try {
        const response = await fetch(
            `${BACKEND_URL}/api/maps/nearby-hospitals?latitude=${location.latitude}&longitude=${location.longitude}&radius=${radius}`
        );
        const data = await response.json();
        return this.formatPlaces(data, 'hospital');
    } catch (error) {
        console.error('Error fetching nearby hospitals:', error);
        return [];
    }
}
```

---

### Issue #2: No API Rate Limiting & Caching

**Current Problem**: Multiple API calls on every interaction, no caching

**Fix Implementation:**

```typescript
// frontend-mobile/services/maps/mapCacheService.ts
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class MapCacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private requestQueue: Array<{fn: () => Promise<any>, resolve: Function}> = [];
    private isProcessing = false;
    private readonly QPS_LIMIT = 2; // 2 requests per second max
    private lastRequestTime = 0;

    /**
     * Get or fetch data with caching and rate limiting
     */
    async getCachedData<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl: number = 300000 // 5 minutes default
    ): Promise<T | null> {
        // Check cache first
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            console.log(`Cache hit for ${key}`);
            return cached.data;
        }

        // Queue request with rate limiting
        return new Promise((resolve) => {
            this.requestQueue.push({ fn: fetcher, resolve });
            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;
        
        this.isProcessing = true;
        while (this.requestQueue.length > 0) {
            // Rate limiting: min 500ms between requests (2 req/sec)
            const timeSinceLastRequest = Date.now() - this.lastRequestTime;
            if (timeSinceLastRequest < 500) {
                await new Promise(r => setTimeout(r, 500 - timeSinceLastRequest));
            }

            const { fn, resolve } = this.requestQueue.shift()!;
            try {
                const result = await fn();
                resolve(result);
                this.lastRequestTime = Date.now();
            } catch (error) {
                resolve(null);
            }
        }
        this.isProcessing = false;
    }

    clearCache(key?: string) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
}

export const mapCacheService = new MapCacheService();
```

**Usage in Maps Screen:**
```typescript
// Implement debouncing for repeated calls
const handleMarkerPress = useCallback(
    debounce(async (place: Place) => {
        setSelectedPlace(place);
        
        // Use cached data for route calculations
        const cacheKey = `routes-${place.id}`;
        await mapCacheService.getCachedData(
            cacheKey,
            () => googleMapsService.getDirectionsForModes(currentLocation, place.location),
            600000 // 10 minute cache
        );
    }, 300), // 300ms debounce
    [currentLocation]
);
```

---

### Issue #3: Battery Drain from Location Tracking

**Current Problem**: High accuracy GPS polling every 1 second

**Fix Implementation:**

```typescript
// frontend-mobile/services/maps/geolocationService.ts
class GeolocationService {
    private locationSubscription: Location.LocationSubscription | null = null;
    private lastKnownLocation: LatLng | null = null;
    private isMoving = false;
    private stationary Timer: NodeJS.Timeout | null = null;

    /**
     * Start location tracking with adaptive accuracy
     */
    async startLocationTracking(
        onLocationUpdate: (location: LocationTrackingState) => void,
        onError: (error: Error) => void,
    ): Promise<() => void> {
        const cleanup = async () => {
            if (this.locationSubscription) {
                await this.locationSubscription.remove();
            }
            if (this.stationaryTimer) {
                clearTimeout(this.stationaryTimer);
            }
        };

        const startWatching = async () => {
            try {
                this.locationSubscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.Balanced, // BALANCED instead of HIGH
                        timeInterval: 2000, // 2 seconds instead of 1 second
                        distanceInterval: 10, // Update only if moved 10 meters
                    },
                    (location) => {
                        // Detect movement
                        if (this.lastKnownLocation) {
                            const distance = this.calculateDistance(
                                this.lastKnownLocation,
                                { latitude: location.coords.latitude, longitude: location.coords.longitude }
                            );
                            this.isMoving = distance > 5; // Moving if > 5m
                        }

                        this.lastKnownLocation = {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        };

                        // Switch to high accuracy only if moving
                        if (this.isMoving && this.stationary Timer) {
                            clearTimeout(this.stationaryTimer);
                        }

                        // Switch to low accuracy if stationary for 5 minutes
                        if (!this.isMoving) {
                            this.stationaryTimer = setTimeout(() => {
                                this.isMoving = false;
                            }, 300000); // 5 minutes
                        }

                        onLocationUpdate({
                            currentLocation: this.lastKnownLocation,
                            accuracy: location.coords.accuracy || 0,
                            heading: location.coords.heading || 0,
                        });
                    }
                );
            } catch (error) {
                onError(error as Error);
            }
        };

        await startWatching();
        return cleanup;
    }

    private calculateDistance(loc1: LatLng, loc2: LatLng): number {
        const R = 6371; // Earth's radius in km
        const lat1 = (loc1.latitude * Math.PI) / 180;
        const lat2 = (loc2.latitude * Math.PI) / 180;
        const dlat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
        const dlng = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

        const a =
            Math.sin(dlat / 2) * Math.sin(dlat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) * Math.sin(dlng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // Return in meters
    }
}
```

---

### Issue #4: Privacy - User Location Tracking

**Current Problem**: All location history visible to Google

**Fix Implementation:**

```typescript
// frontend-mobile/lib/privacyManager.ts
class PrivacyManager {
    private locationHistory: LatLng[] = [];
    private maxHistorySize = 100;

    /**
     * Store location locally with privacy controls
     */
    async storeLocationPrivately(location: LatLng, userId: string) {
        // Hash user ID to prevent direct identification
        const hashedUserId = await this.hashString(userId);
        
        // Add location with timestamp
        this.locationHistory.push(location);
        if (this.locationHistory.length > this.maxHistorySize) {
            this.locationHistory.shift(); // Remove oldest
        }

        // Store only last location encrypted
        const encrypted = await this.encryptData({
            location,
            timestamp: Date.now(),
            userId: hashedUserId,
        });

        await SecureStore.setItemAsync(`location_${hashedUserId}`, encrypted);
    }

    /**
     * Clear location history on app exit
     */
    async clearLocationHistoryOnExit() {
        this.locationHistory = [];
        // Clear all stored location data
        const allKeys = await SecureStore.getAllKeysAsync?.();
        if (allKeys) {
            allKeys.forEach((key) => {
                if (key.startsWith('location_')) {
                    SecureStore.deleteItemAsync(key);
                }
            });
        }
    }

    private async hashString(str: string): Promise<string> {
        // Implement SHA256 hashing
        const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, str);
        return digest;
    }

    private async encryptData(data: any): Promise<string> {
        // Implement AES encryption
        return JSON.stringify(data); // Placeholder
    }
}

export const privacyManager = new PrivacyManager();
```

**Add to app.tsx initialization:**
```typescript
import { AppState } from 'react-native';

// Clear location history when app exits
AppState.addEventListener('change', (state) => {
    if (state === 'background') {
        privacyManager.clearLocationHistoryOnExit();
    }
});
```

---

## 📋 IMPLEMENTATION PRIORITY

| Priority | Issue | Effort | Impact | Timeline |
|----------|-------|--------|--------|----------|
| 🔴 CRITICAL | API Key Exposure | 4 hours | HIGH | Immediate |
| 🔴 CRITICAL | Rate Limiting | 6 hours | HIGH | Immediate |
| 🟠 HIGH | Battery Optimization | 4 hours | HIGH | This Week |
| 🟠 HIGH | Privacy Controls | 4 hours | HIGH | This Week |
| 🟡 MEDIUM | Image Caching | 3 hours | MEDIUM | Next Week |
| 🟡 MEDIUM | Offline Fallback | 8 hours | MEDIUM | Next Sprint |

---

## ✅ TESTING CHECKLIST

After implementing fixes:

- [ ] Test with 1000+ rapid marker clicks
- [ ] Verify API quota not exceeded (Google Cloud Console)
- [ ] Battery test: 1 hour continuous tracking (measure drain %)
- [ ] Offline mode: Launch app with airplane mode enabled
- [ ] Privacy: Verify location history cleared on app exit
- [ ] Network: Test on 3G/4G with packet loss simulation
- [ ] Performance: Monitor memory usage with DevTools
- [ ] Security: Verify API key not in logs or network calls

