# Disease Prediction Module - Architecture & Implementation Summary

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERACTION FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND - Expo React Native (Port 3000)                   │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  Home Screen (index.tsx)                                               │  │
│  │  ├─ Navbar with Logo, Search, Profile                                 │  │
│  │  ├─ Feature Cards (Human Diseases, Disease Prediction, Maps, etc.)   │  │
│  │  └─ Disease Prediction Card → Navigates to disease-prediction.tsx    │  │
│  │                                                                        │  │
│  │  Disease Prediction Screen (disease-prediction.tsx) ✨ NEW            │  │
│  │  ├─ Input: Symptom field (textarea, comma-separated)                 │  │
│  │  ├─ Buttons: Predict (green), Clear                                  │  │
│  │  ├─ Results: Disease name, Confidence score, Progress bar            │  │
│  │  ├─ Info: Tips and disclaimer                                        │  │
│  │  └─ API Call: POST to http://192.168.1.5:8016/api/predict-disease    │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                        HTTP POST (JSON with symptoms)
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│              SPRING BOOT BACKEND - Java (Port 8016) ✨ NEW                    │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  DiseaseController.java - REST API                                    │  │
│  │  ├─ @PostMapping("/api/predict-disease")                              │  │
│  │  │  └─ Accepts: DiseaseSymptomRequest { symptoms[] }                  │  │
│  │  │  └─ Returns: DiseaseSymptomResponse { disease, confidence, ... }   │  │
│  │  ├─ @GetMapping("/api/health") - Health check                         │  │
│  │  └─ @CrossOrigin(origins="*") - Enable CORS                           │  │
│  │                                                                        │  │
│  │  DiseaseService.java - Business Logic                                 │  │
│  │  ├─ predictDisease() - Validates input, calls ML service             │  │
│  │  ├─ checkMlServiceHealth() - Checks ML service availability          │  │
│  │  ├─ Uses: RestTemplate for HTTP calls                                 │  │
│  │  └─ Error Handling: Catches exceptions, returns error responses      │  │
│  │                                                                        │  │
│  │  DTOs (Data Transfer Objects) ✨ NEW                                  │  │
│  │  ├─ DiseaseSymptomRequest - Request payload                           │  │
│  │  └─ DiseaseSymptomResponse - Response payload                         │  │
│  │                                                                        │  │
│  │  Configuration                                                        │  │
│  │  ├─ BackendApplication.java - RestTemplate & ObjectMapper beans      │  │
│  │  └─ application.properties - ML service URL config                    │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                        HTTP POST (Forward to ML Service)
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│           PYTHON ML SERVICE - Flask API (Port 5000) ✨ NEW                    │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  Models Loaded on Startup                                             │  │
│  │  ├─ xgboost_disease_model.joblib - Main prediction model              │  │
│  │  ├─ all_symptoms.joblib - List of all possible symptoms              │  │
│  │  └─ label_encoder.joblib - Disease name encoder                      │  │
│  │                                                                        │  │
│  │  API Endpoints                                                        │  │
│  │  ├─ POST /api/predict-disease                                         │  │
│  │  │  ├─ Input: { "symptoms": ["fever", "cough"] }                     │  │
│  │  │  ├─ Process:                                                       │  │
│  │  │  │  1. Validate symptoms                                          │  │
│  │  │  │  2. Create feature vector from symptom list                    │  │
│  │  │  │  3. Run XGBoost model inference                                │  │
│  │  │  │  4. Get prediction & confidence score                          │  │
│  │  │  │  5. Decode disease name using label encoder                    │  │
│  │  │  └─ Output: { "disease": "...", "confidence": 0.95, ... }         │  │
│  │  ├─ GET /health - Health status                                       │  │
│  │  └─ GET /api/symptoms - List all available symptoms                  │  │
│  │                                                                        │  │
│  │  CORS: Enabled for all origins                                        │  │
│  │  Logging: Detailed logs for debugging                                 │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                         Response (Disease & Confidence)
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND - Display Results                            │
│  ├─ Disease Name (Large, Green Text)                                         │
│  ├─ Confidence Score (Percentage & Progress Bar)                             │
│  └─ Disclaimer Message                                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Routing**: Expo Router (File-based)
- **Components**: Custom ThemedText, ThemedView
- **HTTP**: Fetch API
- **State**: React Hooks (useState)

### Backend
- **Framework**: Spring Boot 4.0.6
- **Language**: Java 21
- **Build**: Maven (with Wrapper)
- **Key Libraries**:
  - Spring Security
  - Spring Validation
  - Spring WebMVC
  - Lombok (for DTOs)
  - Jackson (JSON processing)

### ML Service
- **Framework**: Flask 3.0.0
- **Language**: Python 3.8+
- **ML Model**: XGBoost 2.0.3
- **Utilities**:
  - joblib 1.3.2 (Model serialization)
  - numpy 1.24.3 (Array operations)
  - Flask-CORS 4.0.0 (Cross-origin support)

---

## Data Flow & API Contracts

### 1. Frontend → Backend Request
```json
POST http://192.168.1.5:8016/api/predict-disease
Content-Type: application/json

{
  "symptoms": ["fever", "cough", "headache"]
}
```

### 2. Backend → ML Service Request
```json
POST http://192.168.1.5:5000/api/predict-disease
Content-Type: application/json

{
  "symptoms": ["fever", "cough", "headache"]
}
```

### 3. ML Service → Backend Response
```json
{
  "success": true,
  "disease": "common_cold",
  "confidence": 0.87,
  "matched_symptoms": ["fever", "cough"],
  "unmatched_symptoms": ["headache"],
  "message": "Based on the provided symptoms, the predicted disease is common_cold with 87.00% confidence. Please consult a healthcare professional for accurate diagnosis."
}
```

### 4. Backend → Frontend Response
```json
{
  "success": true,
  "disease": "common_cold",
  "confidence": 0.87,
  "matchedSymptoms": ["fever", "cough"],
  "unmatchedSymptoms": ["headache"],
  "message": "Based on the provided symptoms, the predicted disease is common_cold with 87.00% confidence. Please consult a healthcare professional for accurate diagnosis."
}
```

---

## File Organization

### New Files Created

**Frontend**
```
frontend-mobile/app/disease-prediction.tsx
  ├─ Symptom input field
  ├─ Predict & Clear buttons
  ├─ Results display with styling
  └─ API integration via fetch
```

**Backend - Java Controller**
```
Backend/src/main/java/com/aarogyamitra/backend/
├─ controller/
│  └─ DiseaseController.java (REST endpoints)
├─ service/
│  └─ DiseaseService.java (Business logic)
└─ dto/
   ├─ DiseaseSymptomRequest.java
   └─ DiseaseSymptomResponse.java
```

**ML Service - Python**
```
ml_services/Disease_Prediction/
├─ app.py (Flask API server)
└─ requirements.txt (Python dependencies)
```

**Configuration**
```
Backend/src/main/resources/application.properties
  └─ Updated with port 8016, ML service URL

Backend/src/main/java/.../BackendApplication.java
  └─ Added RestTemplate and ObjectMapper beans

frontend-mobile/app/_layout.tsx
  └─ Added disease-prediction route to router stack

frontend-mobile/app/index.tsx
  └─ Updated Disease Prediction card to navigate to screen
```

**Documentation**
```
DISEASE_PREDICTION_QUICKSTART.md (Quick 3-step start)
DISEASE_PREDICTION_SETUP.md (Comprehensive guide)
DISEASE_PREDICTION_ARCHITECTURE.md (This file)
```

---

## Deployment Checklist

- [ ] All 3 services start without errors
- [ ] ML Service loads models successfully (console shows ✓)
- [ ] Backend connects to ML Service (health endpoint returns healthy)
- [ ] Frontend can reach backend (network connectivity verified)
- [ ] Test prediction flow with sample symptoms
- [ ] Verify confidence scores are realistic (0-1 range)
- [ ] Check error handling (test with invalid symptoms)
- [ ] Validate CORS headers are correct

---

## Performance Considerations

1. **Model Loading**: Models loaded once at ML service startup (~2-3 seconds)
2. **Prediction Time**: XGBoost inference typically <100ms
3. **Network Latency**: Frontend → Backend → ML Service adds ~50-100ms
4. **Frontend Response**: Total time visible to user ~200-400ms
5. **Caching**: Consider caching predictions for duplicate requests

---

## Security Notes

1. **CORS**: Currently enabled for all origins (`*`) - Restrict in production
2. **Input Validation**: Symptoms are validated on both backend and ML service
3. **Error Messages**: Sanitized to prevent information leakage
4. **ML Service**: Should be behind authentication in production
5. **HTTPS**: Use in production instead of HTTP

---

## Future Enhancements

1. **Database Integration**
   - Save predictions per user
   - Track prediction history
   - Analytics and reporting

2. **Model Improvements**
   - Add more disease models
   - Improve accuracy with larger training datasets
   - Implement ensemble models

3. **UX Enhancements**
   - Real-time symptom suggestions
   - Severity assessment levels
   - Provider recommendations nearby

4. **Backend Features**
   - Caching layer (Redis)
   - Rate limiting
   - API versioning
   - WebSocket for real-time updates

5. **ML Features**
   - Confidence threshold warnings
   - Alternative diagnoses (top 3)
   - Symptom importance weights
   - Personalization based on user history

---

## Monitoring & Logging

### Backend Logs
- Location: Console output
- Level: DEBUG for com.aarogyamitra.backend
- Key logs: Model loading, API calls, errors

### Frontend Logs
- Browser Console (via Expo)
- Network tab for API requests
- React DevTools for component state

### ML Service Logs
- Console output when running `python app.py`
- Shows model loading status, predictions, errors
- Accessible at startup

---

## Troubleshooting Quick Reference

| Component | Port | Test URL | Expected | Issue |
|-----------|------|----------|----------|-------|
| Frontend | 3000 | `npm start` | QR code | Emulator/phone issues |
| Backend | 8016 | `curl 192.168.1.5:8016/api/health` | ✓ connected | Port conflict, Java not installed |
| ML Service | 5000 | `curl 192.168.1.5:5000/health` | ✓ Models loaded | Python issue, missing dependencies |

---

**Architecture & Implementation Complete! 🎉**
