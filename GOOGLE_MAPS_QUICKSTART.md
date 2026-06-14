# Google Maps Integration - Quick Start Guide

## 📋 What's Been Implemented

### Frontend Features
✅ Interactive Google Maps with real-time location tracking
✅ Custom markers: ❤️ for hospitals, ➕ for pharmacies
✅ Distance calculation (Haversine formula)
✅ Route display with polyline
✅ ETA calculation
✅ Place search functionality
✅ Bottom sheet with place details
✅ Direct call functionality
✅ Website links
✅ Ratings display
✅ Open/closed status
✅ Nearby places list
✅ Tab-based filtering
✅ User-friendly interface

### Backend Services
✅ `/api/maps/nearby/hospitals` - Get nearby hospitals
✅ `/api/maps/nearby/pharmacies` - Get nearby pharmacies
✅ `/api/maps/nearby/clinics` - Get nearby clinics
✅ `/api/maps/search` - Search by keyword
✅ `/api/maps/distance` - Calculate distance
✅ Distance calculation service
✅ Location validation

### Project Structure
```
Maps Integration Files:
├── Frontend Mobile
│   ├── app/maps.tsx (New)
│   ├── components/maps/
│   │   ├── CustomMarker.tsx (New)
│   │   └── PlaceDetails.tsx (New)
│   ├── services/maps/
│   │   ├── geolocationService.ts (New)
│   │   └── googleMapsService.ts (New)
│   ├── utils/maps/
│   │   ├── mapUtils.ts (New)
│   │   └── mockData.ts (New)
│   └── types/maps.ts (New)
├── Backend
│   ├── controller/MapsController.java (New)
│   ├── service/MapsService.java (New)
│   ├── dto/NearbyPlacesRequest.java (New)
│   └── dto/NearbyPlacesResponse.java (New)
└── Documentation
    ├── GOOGLE_MAPS_INTEGRATION.md (New)
    └── GOOGLE_MAPS_QUICKSTART.md (This file)
```

## 🚀 Getting Started

### Step 1: Install Dependencies
```bash
cd d:\AarogyaMitra\AarogyaMitra
npm install
```

The following packages have been added to package.json:
- `expo-location` - For location tracking
- `expo-maps` - For Expo maps support
- `react-native-maps` - For interactive maps

### Step 2: Backend Setup

#### Start Backend Server
```bash
cd backend
./mvnw spring-boot:run
# OR on Windows
mvnw.cmd spring-boot:run
```

The backend will run on `http://localhost:8016`

#### Test Backend Endpoints
```bash
# Get nearby hospitals
curl -X POST http://localhost:8016/api/maps/nearby/hospitals \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.7041,
    "longitude": 77.1025,
    "radius": 5000
  }'

# Health check
curl http://localhost:8016/api/maps/health
```

### Step 3: Configure Google Maps API Key

The API key is already embedded in the service:
```
AIzaSyAWjgA1WFrwi38-pDvR-DeWbAoAcfWHuAU
```

**For Production:**
1. Create `.env` file in project root:
```
GOOGLE_MAPS_API_KEY=AIzaSyAWjgA1WFrwi38-pDvR-DeWbAoAcfWHuAU
```

2. Update `googleMapsService.ts`:
```typescript
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_KEY_HERE';
```

### Step 4: Request Permissions (Mobile)

The app will request location permission when opening the maps screen. Users need to grant:
- **Foreground location** - Required (always)
- **Background location** - Optional (for tracking)

### Step 5: Run the Application

```bash
# Start frontend and backend together
npm start

# OR start only frontend
npm run expo-only

# Run on specific platform
npm run android
npm run ios
```

## 📱 Using the Maps Feature

### Navigation
1. Open the app and go to home screen
2. Tap the **"Maps"** card
3. App requests location permission - tap **"Allow"**
4. Map loads with nearby hospitals and pharmacies

### Features

**View Locations**
- Scroll to see different places
- Red markers (❤️) = Hospitals
- Blue markers (➕) = Pharmacies

**Search**
- Use search bar at top to find specific places
- Search by name or address

**View Details**
- Tap any marker to see full details
- View rating, distance, and ETA
- See opening hours and business status

**Navigation**
- Tap "Navigate" button to get directions
- View route on map with polyline
- See turn-by-turn directions

**Track Location**
- Tap navigation icon to enable live tracking
- Your location updates in real-time
- Map centers on your current position

**Zoom Controls**
- Tap "Current Location" to zoom to your position
- Tap "Zoom Out" to see all nearby places
- Pinch to zoom in/out manually

## 🔧 Configuration Options

### Default Search Radius
Edit `maps.tsx`:
```typescript
const [searchRadius, setSearchRadius] = useState(5000); // 5km
```

### Change Marker Symbols
Edit `mapUtils.ts`:
```typescript
export function getMarkerSymbol(placeType: string): string {
  // Customize symbols for different place types
}
```

### Change Map Region
Edit `maps.tsx`:
```typescript
const INITIAL_REGION = {
  latitude: 20.5937,      // Center of India
  longitude: 78.9629,
  latitudeDelta: 10,
  longitudeDelta: 10,
};
```

## 🧪 Testing with Mock Data

Use mock data for testing without API calls:

```typescript
import mockData from '@/utils/maps/mockData';

// Use in maps.tsx
setNearbyPlaces({
  hospitals: mockData.hospitals,
  pharmacies: mockData.pharmacies,
});
```

## 📊 API Response Examples

### Get Nearby Hospitals
```bash
POST /api/maps/nearby/hospitals
Content-Type: application/json

{
  "latitude": 28.7041,
  "longitude": 77.1025,
  "radius": 5000
}
```

Response:
```json
{
  "places": [
    {
      "id": "place_123",
      "name": "Apollo Hospital",
      "placeType": "hospital",
      "location": {
        "latitude": 28.7041,
        "longitude": 77.1025
      },
      "address": "12, Parliament Street, New Delhi",
      "distance": 1200.5,
      "rating": 4.7,
      "phoneNumber": "+91-11-XXXX-XXXX",
      "isOpen": true,
      "businessStatus": "OPERATIONAL"
    }
  ],
  "status": "OK",
  "message": "Successfully fetched nearby hospitals"
}
```

## 🐛 Troubleshooting

### Issue: "Location permission denied"
**Solution:**
- Go to Settings > AarogyaMitra > Permissions > Location
- Change to "Always" or "While Using App"
- Restart the app

### Issue: "Map is blank"
**Solution:**
- Check internet connection
- Verify Google Maps API key is valid
- Clear app cache: `npm run reset-project`
- Restart the app

### Issue: "Markers not showing"
**Solution:**
- Wait for location to load (may take 2-3 seconds)
- Check if you're in a location with available places
- Verify the API response is not empty

### Issue: "Search not working"
**Solution:**
- Ensure you have internet connection
- Check that the backend is running
- Verify API key has quota remaining

### Issue: "Backend connection error"
**Solution:**
- Start backend: `cd backend && ./mvnw spring-boot:run`
- Verify backend is running on port 8016
- Check firewall settings
- Try using `localhost:8016` or `127.0.0.1:8016`

## 📝 Example Code Snippets

### Get Current Location
```typescript
import { geolocationService } from '@/services/maps/geolocationService';

const location = await geolocationService.getCurrentLocation();
console.log(`Current location: ${location.latitude}, ${location.longitude}`);
```

### Find Nearby Hospitals
```typescript
import { googleMapsService } from '@/services/maps/googleMapsService';

const hospitals = await googleMapsService.getNearbyHospitals(
  { latitude: 28.7041, longitude: 77.1025 },
  5000  // 5km radius
);

hospitals.forEach(hospital => {
  console.log(`${hospital.name} - ${hospital.distance}m away`);
});
```

### Get Directions
```typescript
const directions = await googleMapsService.getDirections(
  { latitude: 28.7041, longitude: 77.1025 },  // Origin
  { latitude: 28.7234, longitude: 77.1234 }   // Destination
);

console.log(`Distance: ${directions.distance}m`);
console.log(`Duration: ${directions.duration}s`);
```

## 🔐 Security Considerations

### API Key Protection
- Current implementation uses API key directly in code
- **Do NOT commit API key to version control**
- Use environment variables in production
- Implement backend proxy for API calls
- Set API key restrictions in Google Cloud Console

### Location Privacy
- Only request location when needed
- Allow users to disable tracking
- Don't store location history indefinitely
- Comply with privacy regulations (GDPR, etc.)

## 🎯 Next Steps

1. **Test on Real Device**
   ```bash
   npm run android
   npm run ios
   ```

2. **Customize UI**
   - Edit styles in `styles` object in `maps.tsx`
   - Change colors, sizes, and layouts
   - Customize marker appearance

3. **Integrate with Backend**
   - Replace mock data with real API calls
   - Implement caching for better performance
   - Add error handling

4. **Add Advanced Features**
   - Marker clustering for large datasets
   - Offline map support
   - Multiple route alternatives
   - Traffic overlay
   - Appointment booking

5. **Performance Optimization**
   - Implement pagination for large result sets
   - Add lazy loading for place details
   - Cache images and responses
   - Optimize map rendering

## 📚 Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps)
- [Google Places API](https://developers.google.com/maps/documentation/places)
- [Expo Location API](https://docs.expo.dev/versions/latest/sdk/location/)
- [React Native Maps GitHub](https://github.com/react-native-maps/react-native-maps)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)

## 🎓 Learning Resources

For developers new to maps integration:
1. Understand latitude/longitude coordinates
2. Learn about the Haversine formula for distance
3. Understand polyline encoding for routes
4. Study REST API best practices
5. Learn about location permissions in mobile apps

## 📞 Support

For issues or questions:
1. Check this quickstart guide
2. Review the full integration documentation: `GOOGLE_MAPS_INTEGRATION.md`
3. Check backend logs: `tail -f backend/logs/application.log`
4. Run `npm run lint` to check for errors
5. Contact the development team

## ✅ Verification Checklist

- [ ] Dependencies installed
- [ ] Backend running on port 8016
- [ ] Google Maps API key configured
- [ ] Location permissions granted
- [ ] Map loads on first run
- [ ] Nearby hospitals show with ❤️ marker
- [ ] Nearby pharmacies show with ➕ marker
- [ ] Search functionality works
- [ ] Details sheet opens on marker tap
- [ ] Navigation button works
- [ ] Call button works
- [ ] Zoom controls work
- [ ] Location tracking works

Once all items are checked, your Google Maps integration is complete! 🎉
