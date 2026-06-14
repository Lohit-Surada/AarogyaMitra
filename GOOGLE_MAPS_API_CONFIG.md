# Google Maps API Configuration Guide

## 🔑 API Key Management

### Current API Key
```
AIzaSyAWjgA1WFrwi38-pDvR-DeWbAoAcfWHuAU
```

This key is configured for:
- ✅ Google Places API (Nearby Search)
- ✅ Google Maps API (Directions)
- ✅ Maps JavaScript API

### ⚠️ Security Warning
The API key is currently embedded in the source code. This is **NOT** recommended for production.

## 🚀 Production Setup

### Step 1: Create Environment Variables

Create `.env` file in project root:
```env
GOOGLE_MAPS_API_KEY=AIzaSyAWjgA1WFrwi38-pDvR-DeWbAoAcfWHuAU
BACKEND_URL=http://localhost:8016
MAPS_SEARCH_RADIUS=5000
MAPS_MAX_RESULTS=20
LOG_LEVEL=info
```

Create `.env.local` for local development (add to `.gitignore`):
```env
GOOGLE_MAPS_API_KEY=your_dev_key_here
BACKEND_URL=http://localhost:8016
```

### Step 2: Update Frontend Code

**Update `frontend-mobile/services/maps/googleMapsService.ts`:**
```typescript
// Change from:
const GOOGLE_MAPS_API_KEY = 'AIzaSyAWjgA1WFrwi38-pDvR-DeWbAoAcfWHuAU';

// To:
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'default_key';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8016';
```

### Step 3: Update Backend Configuration

**Update `backend/src/main/resources/application.properties`:**
```properties
# Google Maps Configuration
google.maps.api.key=${GOOGLE_MAPS_API_KEY}
google.maps.api.base.url=https://maps.googleapis.com/maps/api

# CORS Configuration
cors.allowed-origins=http://localhost:3000,http://localhost:8081

# Application Configuration
server.port=8016
server.servlet.context-path=/api
logging.level.root=INFO
logging.level.com.aarogyamitra=DEBUG
```

### Step 4: Update .gitignore

Add to `.gitignore`:
```
.env
.env.local
.env*.local
*.key
*.pem
.env.production.local
.env.*.local
backend/logs/
frontend-mobile/node_modules/.expo/
```

## 🔐 API Key Restrictions (Google Cloud Console)

### 1. HTTP Referrers Restrictions
```
http://localhost:3000/*
http://localhost:8081/*
https://yourdomain.com/*
https://*.yourdomain.com/*
```

### 2. API Restrictions
Enable only required APIs:
- ✅ Places API
- ✅ Maps JavaScript API
- ✅ Directions API
- ❌ Disable unused APIs

### 3. Quotas and Limits
Set up billing alerts:
- Daily quota limit
- Cost alerts
- Usage monitoring

## 📱 Expo Configuration

### 1. Install Expo Secrets CLI
```bash
npm install -g eas-cli
```

### 2. Create EAS Configuration

**eas.json:**
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3. Set Secrets for Builds
```bash
eas secret create --scope project --name GOOGLE_MAPS_API_KEY
eas secret create --scope project --name BACKEND_URL
```

### 4. Use Secrets in app.json
```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow AarogyaMitra to access your location."
        }
      ]
    ],
    "extra": {
      "googleMapsApiKey": "$GOOGLE_MAPS_API_KEY",
      "backendUrl": "$BACKEND_URL"
    }
  }
}
```

## 🔄 Backend API Key Configuration

### Spring Boot Properties

**application-dev.properties:**
```properties
# Development Environment
server.port=8016
google.maps.api.key=${GOOGLE_MAPS_API_KEY}
logging.level.com.aarogyamitra=DEBUG
```

**application-prod.properties:**
```properties
# Production Environment
server.port=8080
google.maps.api.key=${GOOGLE_MAPS_API_KEY}
server.ssl.enabled=true
server.ssl.key-store=${SSL_KEYSTORE_PATH}
server.ssl.key-store-password=${SSL_KEYSTORE_PASSWORD}
logging.level.com.aarogyamitra=INFO
```

### Spring Boot Service Update

**Backend MapsService.java:**
```java
import org.springframework.beans.factory.annotation.Value;

@Service
public class MapsService {
    
    @Value("${google.maps.api.key}")
    private String googleMapsApiKey;
    
    @Value("${google.maps.api.base.url}")
    private String googleMapsBaseUrl;
    
    public String getApiKey() {
        return googleMapsApiKey;
    }
}
```

## 🚢 Deployment Configuration

### Docker Configuration

**Dockerfile:**
```dockerfile
FROM openjdk:21-slim
WORKDIR /app
COPY backend/target/*.jar app.jar
ENV GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
ENV BACKEND_URL=${BACKEND_URL}
EXPOSE 8016
ENTRYPOINT ["java","-jar","app.jar"]
```

**.dockerignore:**
```
.git
.gitignore
.env
.env.local
node_modules
backend/target
```

### Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build: .
    container_name: aarogyamitra-backend
    ports:
      - "8016:8016"
    environment:
      GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY}
      BACKEND_URL: ${BACKEND_URL}
    networks:
      - aarogyamitra-network

  frontend:
    image: node:21
    container_name: aarogyamitra-frontend
    working_dir: /app
    volumes:
      - .:/app
    ports:
      - "8081:8081"
    environment:
      GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY}
      BACKEND_URL: http://backend:8016
    depends_on:
      - backend
    networks:
      - aarogyamitra-network

networks:
  aarogyamitra-network:
    driver: bridge
```

### Environment Variables for Deployment

```bash
# Before deployment, set these environment variables
export GOOGLE_MAPS_API_KEY="AIzaSyAWjgA1WFrwi38-pDvR-DeWbAoAcfWHuAU"
export BACKEND_URL="http://localhost:8016"
export NODE_ENV="production"
export LOG_LEVEL="info"

# Run Docker Compose
docker-compose up -d
```

## 🔍 Monitoring and Logging

### Enable Detailed Logging

**Backend logging configuration:**
```properties
logging.level.root=INFO
logging.level.com.aarogyamitra=DEBUG
logging.level.org.springframework.web=DEBUG
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
logging.file.name=logs/application.log
logging.file.max-size=10MB
logging.file.max-history=10
```

### API Usage Monitoring

Monitor in Google Cloud Console:
1. Go to APIs & Services > Quotas
2. Set up alerts for:
   - API calls exceeding threshold
   - Cost exceeding budget
   - Usage anomalies

## 🛡️ Security Best Practices

### 1. API Key Rotation
- Rotate keys every 90 days
- Create new key before deleting old one
- Update all services with new key
- Monitor usage for anomalies

### 2. Rate Limiting
```java
@Configuration
public class RateLimitingConfig {
    @Bean
    public RateLimitingInterceptor rateLimitingInterceptor() {
        return new RateLimitingInterceptor(1000, 60); // 1000 requests per minute
    }
}
```

### 3. Request Validation
```typescript
// Validate coordinates before API call
function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
```

### 4. Error Handling
Never expose API keys in error messages:
```typescript
// ❌ Bad
console.error(`API error: ${error.message}`, { apiKey: key });

// ✅ Good
console.error('Failed to fetch locations');
logger.debug(`API error details:`, { error, requestId: id });
```

## 📊 Cost Optimization

### 1. Caching Strategies
- Cache nearby places for 1 hour
- Cache distance calculations for 24 hours
- Implement Redis for backend caching

### 2. Optimize API Calls
- Batch multiple queries
- Filter results before returning
- Implement pagination
- Use appropriate result limits

### 3. Monitor Costs
- Set up Google Cloud billing alerts
- Implement usage quotas
- Monitor daily/monthly trends
- Optimize high-cost operations

## 🔗 CI/CD Integration

### GitHub Actions Workflow

**.github/workflows/deploy.yml:**
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up environment
        run: |
          echo "GOOGLE_MAPS_API_KEY=${{ secrets.GOOGLE_MAPS_API_KEY }}" >> .env
          echo "BACKEND_URL=${{ secrets.BACKEND_URL }}" >> .env
      
      - name: Build and push
        run: |
          docker build -t aarogyamitra:latest .
          docker push your-registry/aarogyamitra:latest
```

## 🧪 Testing API Configuration

### Test API Key Validity
```bash
curl -X GET "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=28.7041,77.1025&radius=5000&type=hospital&key=YOUR_KEY"
```

### Test Backend Configuration
```bash
curl -X POST http://localhost:8016/api/maps/nearby/hospitals \
  -H "Content-Type: application/json" \
  -d '{"latitude": 28.7041, "longitude": 77.1025, "radius": 5000}'
```

## ✅ Configuration Checklist

- [ ] `.env` file created with API key
- [ ] `.gitignore` updated to exclude `.env`
- [ ] Backend `application.properties` updated
- [ ] Google Cloud Console restrictions set
- [ ] Docker configuration ready
- [ ] CI/CD secrets configured
- [ ] Logging properly configured
- [ ] Error handling tested
- [ ] Rate limiting implemented
- [ ] Monitoring set up

## 📞 Troubleshooting Configuration

### Issue: "Invalid API key"
**Solution:**
1. Verify key in Google Cloud Console
2. Check key restrictions allow your domain
3. Enable required APIs
4. Wait 5 minutes for changes to propagate

### Issue: "CORS error"
**Solution:**
1. Update CORS configuration in backend
2. Add your domain to allowed origins
3. Check browser console for specific error

### Issue: "Over quota"
**Solution:**
1. Check Google Cloud Console billing
2. Set up quota alerts
3. Optimize API usage
4. Consider pagination

## 📚 References

- [Google Cloud Console](https://console.cloud.google.com)
- [Google Maps Platform Pricing](https://mapsplatform.google.com/maps-products/#pricing)
- [Spring Boot Configuration](https://spring.io/projects/spring-boot)
- [Expo Environment Variables](https://docs.expo.dev/build-reference/variables/)

For complete integration details, refer to `GOOGLE_MAPS_INTEGRATION.md` and `GOOGLE_MAPS_QUICKSTART.md`.
