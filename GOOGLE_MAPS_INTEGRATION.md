# Google Maps Integration Guide

## Overview
This guide explains the Google Maps integration for AarogyaMitra, which enables users to find nearby hospitals, pharmacies, and other healthcare services with an interactive map interface.

## Features
- 📍 Real-time location tracking
- 🏥 Find nearby hospitals (marked with ❤️)
- 💊 Find nearby pharmacies (marked with ➕)
- 🗺️ Interactive map with custom markers
- 📏 Distance calculation and ETA
- 🛣️ Route display and turn-by-turn navigation
- 🔍 Search functionality for health services
- 📞 Direct call functionality
- 🌐 Website links
- ⭐ Ratings and reviews

## Setup Instructions

### 1. Frontend Setup (React Native/Expo)

#### Install Dependencies
```bash
npm install expo-location react-native-maps
```

#### Required Permissions

**Android (app.json)**
Already configured in app.json with predictiveBackGestureEnabled set.

**iOS Configuration**
Add to `ios/AarogyaMitra/Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to find nearby hospitals and pharmacies</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need your location for background tracking</string>
```

#### Google Maps API Key
The API key is embedded in the service:
```
AIzaSyAWjgA1WFrwi38-pDvR-DeWbAoAcfWHuAU
```

**Note**: In production, store the API key securely in environment variables.

### 2. Backend Setup (Spring Boot)

#### New Endpoints Added
```
POST /api/maps/nearby/hospitals    - Get nearby hospitals
POST /api/maps/nearby/pharmacies   - Get nearby pharmacies
POST /api/maps/nearby/clinics      - Get nearby clinics
POST /api/maps/search              - Search by keyword
POST /api/maps/distance            - Calculate distance
GET  /api/maps/health              - Health check
```

#### Request/Response Format

**Get Nearby Hospitals**
```json
POST /api/maps/nearby/hospitals
{
  "latitude": 28.7041,
  "longitude": 77.1025,
  "radius": 5000,
  "type": "hospital"
}

Response:
{
  "places": [
    {
      "id": "place_id_123",
      "name": "Apollo Hospital",
      "placeType": "hospital",
      "location": {
        "latitude": 28.7041,
        "longitude": 77.1025
      },
      "address": "Apollo Hospital, New Delhi",
      "distance": 1200.5,
      "rating": 4.5,
      "phoneNumber": "+91-11-XXXX-XXXX",
      "website": "https://www.apollohospitals.com",
      "isOpen": true,
      "businessStatus": "OPERATIONAL"
    }
  ],
  "status": "OK",
  "message": "Successfully fetched nearby hospitals"
}
```

### 3. File Structure

```
frontend-mobile/
├── app/
│   └── maps.tsx                    # Main maps screen
├── components/
│   └── maps/
│       ├── CustomMarker.tsx        # Custom marker component
│       └── PlaceDetails.tsx        # Place details sheet
├── services/
│   └── maps/
│       ├── geolocationService.ts   # Location tracking
│       └── googleMapsService.ts    # Google Maps API
├── utils/
│   └── maps/
│       └── mapUtils.ts             # Utility functions
└── types/
    └── maps.ts                     # TypeScript types

backend/
└── src/main/java/com/aarogyamitra/backend/
    ├── controller/
    │   └── MapsController.java     # REST endpoints
    ├── service/
    │   └── MapsService.java        # Business logic
    └── dto/
        ├── NearbyPlacesRequest.java
        └── NearbyPlacesResponse.java
```

## Usage Guide

### For Users

1. **Open Maps Screen**
   - Click "Maps" card on homepage
   - App requests location permission

2. **View Nearby Locations**
   - Hospitals are marked with ❤️ (red)
   - Pharmacies are marked with ➕ (blue)
   - Current location shown as blue dot

3. **Search for Specific Place**
   - Use search bar at top
   - Results update in real-time

4. **Get Details**
   - Tap any marker to see details
   - View distance and estimated time
   - See rating and reviews

5. **Navigate**
   - Tap "Navigate" button
   - View route on map
   - Get turn-by-turn directions

### For Developers

#### Getting User Location
```typescript
import { geolocationService } from '@/services/maps/geolocationService';

// Get current location
const location = await geolocationService.getCurrentLocation();

// Start tracking
const unsubscribe = geolocationService.startLocationTracking(
  (location) => {
    // Handle location update
  },
  (error) => {
    // Handle error
  }
);

// Stop tracking
unsubscribe();
```

#### Fetching Nearby Places
```typescript
import { googleMapsService } from '@/services/maps/googleMapsService';

// Get nearby hospitals
const hospitals = await googleMapsService.getNearbyHospitals(location, 5000);

// Get nearby pharmacies
const pharmacies = await googleMapsService.getNearbyPharmacies(location, 5000);

// Get directions
const directions = await googleMapsService.getDirections(origin, destination);
```

#### Using Backend Endpoints
```typescript
// Get nearby hospitals from backend
const response = await fetch('http://localhost:8016/api/maps/nearby/hospitals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: 28.7041,
    longitude: 77.1025,
    radius: 5000
  })
});
const data = await response.json();
```

## API Reference

### Location Services
- `getCurrentLocation()` - Get current coordinates
- `startLocationTracking(onUpdate, onError)` - Real-time tracking
- `stopLocationTracking()` - Stop tracking
- `getAddressFromCoordinates(coords)` - Reverse geocoding
- `getCoordinatesFromAddress(address)` - Geocoding

### Maps Services
- `getNearbyHospitals(location, radius)` - Search hospitals
- `getNearbyPharmacies(location, radius)` - Search pharmacies
- `getDirections(origin, destination)` - Get route
- `calculateDistance(loc1, loc2)` - Distance calculation
- `formatDistance(meters)` - Format distance
- `formatDuration(seconds)` - Format time
- `decodePolyline(encoded)` - Decode route polyline
- `getPlaceDetails(placeId)` - Get detailed info

### Utility Functions
- `calculateBoundingBox(locations)` - Get bounds
- `filterPlacesByDistance(places, maxDistance)` - Filter by distance
- `sortPlacesByDistance(places)` - Sort by distance
- `sortPlacesByRating(places)` - Sort by rating
- `filterOpenPlaces(places)` - Filter open places
- `getMarkerColor(type)` - Get marker color
- `getMarkerSymbol(type)` - Get marker symbol
- `createRegionFromCoordinates(coord)` - Create map region
- `createRegionFromLocations(locations)` - Fit all locations

## Customization

### Change Map Theme
In `maps.tsx`, modify the MapView styles:
```typescript
<MapView
  style={styles.map}
  customMapStyle={[...]} // Add custom styles
/>
```

### Change Marker Symbols
Edit `mapUtils.ts` `getMarkerSymbol()` function:
```typescript
export function getMarkerSymbol(placeType: string): string {
  switch (placeType) {
    case 'hospital':
      return '🏥'; // Change to hospital emoji
    case 'pharmacy':
      return '💊'; // Change to pill emoji
    ...
  }
}
```

### Change Marker Colors
Edit `mapUtils.ts` `getMarkerColor()` function:
```typescript
export function getMarkerColor(placeType: string): string {
  switch (placeType) {
    case 'hospital':
      return '#ff0000'; // Change color
    ...
  }
}
```

### Adjust Search Radius
In `maps.tsx`, change default radius:
```typescript
const [searchRadius, setSearchRadius] = useState(10000); // 10km
```

## Troubleshooting

### Location Permission Issues
- Android: Go to Settings > Apps > AarogyaMitra > Permissions > Location
- iOS: Go to Settings > AarogyaMitra > Location > "While Using"

### Maps Not Loading
- Verify Google Maps API key is valid
- Check internet connection
- Enable location services on device
- Clear app cache and restart

### Slow Performance
- Reduce search radius
- Limit number of markers displayed
- Enable marker clustering for large datasets

### API Errors
- Check API quota on Google Cloud Console
- Verify coordinates are valid (lat: -90 to 90, lng: -180 to 180)
- Ensure backend is running on port 8016

## Production Checklist

- [ ] Move API key to environment variables
- [ ] Implement request caching
- [ ] Add rate limiting
- [ ] Set up error logging
- [ ] Enable marker clustering
- [ ] Optimize images/assets
- [ ] Test on multiple devices
- [ ] Verify battery optimization
- [ ] Set up analytics
- [ ] Document custom changes
- [ ] Security audit of APIs
- [ ] Performance testing

## Future Enhancements

- Real-time traffic overlay
- Offline map support
- Multiple route alternatives
- Integration with ride-sharing services
- Emergency services alerting
- Appointment booking integration
- Doctor reviews and ratings
- Insurance provider filtering
- Telemedicine integration

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API reference
3. Check backend logs: `tail -f backend/logs/`
4. Contact development team

## References

- [Google Maps API Documentation](https://developers.google.com/maps)
- [Google Places API](https://developers.google.com/maps/documentation/places)
- [Expo Location API](https://docs.expo.dev/versions/latest/sdk/location/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
