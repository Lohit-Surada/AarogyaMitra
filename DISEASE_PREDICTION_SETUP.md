# Disease Prediction Module - Setup & Running Guide

## Overview
The Disease Prediction module consists of three components:
1. **Frontend**: React Native/Expo screen for symptom input
2. **Backend**: Spring Boot API that routes requests to the ML service
3. **ML Service**: Python Flask API that loads and runs the XGBoost disease prediction model

## Prerequisites
- Node.js & npm (for frontend)
- Java 21 (for backend)
- Python 3.8+ (for ML service)
- Maven (or use the included Maven Wrapper)

---

## Setup & Running

### 1. Start the ML Service (Python Flask API)

**First-time setup:**
```bash
cd ml_services/Disease_Prediction

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Run the ML service:**
```bash
# Make sure you're in ml_services/Disease_Prediction directory
python app.py
```

Expected output:
```
==================================================
Disease Prediction ML API Server
==================================================
Status: ✓ Models loaded successfully
Available symptoms: XXXX
Starting server on http://192.168.1.5:5000
==================================================
```

**Test the ML service:**
```bash
# In another terminal, test the health endpoint
curl http://192.168.1.5:5000/health

# Test prediction with sample symptoms
curl -X POST http://192.168.1.5:5000/api/predict-disease \
  -H "Content-Type: application/json" \
  -d '{"symptoms": ["fever", "cough"]}'
```

---

### 2. Start the Spring Boot Backend

**First-time setup:**
```bash
cd Backend

# Clean and build (using Maven Wrapper)
./mvnw clean install
# On Windows: mvnw.cmd clean install
```

**Run the backend:**
```bash
cd Backend

# Using Maven Wrapper
./mvnw spring-boot:run
# On Windows: mvnw.cmd spring-boot:run

# Or run directly
java -jar target/Backend-0.0.1-SNAPSHOT.jar
```

Expected output:
```
...
Backend application started successfully!
Disease Prediction API available at: http://192.168.1.5:8016/api/predict-disease
Health check at: http://192.168.1.5:8016/api/health
...
```

**Test the backend:**
```bash
# Health check
curl http://192.168.1.5:8016/api/health

# Test disease prediction
curl -X POST http://192.168.1.5:8016/api/predict-disease \
  -H "Content-Type: application/json" \
  -d '{"symptoms": ["fever", "cough"]}'
```

---

### 3. Start the Frontend (React Native/Expo)

**First-time setup:**
```bash
cd frontend-mobile

# Install dependencies
npm install
```

**Run the frontend:**
```bash
# Start Expo development server
npm start

# Then:
# Press 'i' for iOS simulator (macOS only)
# Press 'a' for Android emulator
# Or scan the QR code with Expo Go app on your phone
```

---

## Full Setup in Order

**Terminal 1 - ML Service:**
```bash
cd ml_services/Disease_Prediction
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
# Wait for: "Starting server on http://192.168.1.5:5000"
```

**Terminal 2 - Spring Boot Backend:**
```bash
cd Backend
./mvnw spring-boot:run
# Wait for: "Disease Prediction API available at: http://192.168.1.5:8016"
```

**Terminal 3 - Expo Frontend:**
```bash
cd frontend-mobile
npm start
```

Now navigate to the app's home screen and click "Disease Prediction" → "Predict" card to test the flow!

---

## API Endpoints

### Frontend → Backend
- **POST** `http://192.168.1.5:8016/api/predict-disease`
  - Body: `{ "symptoms": ["fever", "cough"] }`
  - Response: `{ "success": true, "disease": "...", "confidence": 0.95, ... }`

### Backend → ML Service
- **POST** `http://192.168.1.5:5000/api/predict-disease`
  - Same format as above
  
### Health Checks
- Backend: `GET http://192.168.1.5:8016/api/health`
- ML Service: `GET http://192.168.1.5:5000/health`

---

## Troubleshooting

### ML Service Issues
- **Models not loading**: Ensure `xgboost_disease_model.joblib`, `all_symptoms.joblib`, and `label_encoder.joblib` exist in `ml_services/Disease_Prediction/Models/`
- **Port 5000 already in use**: Change port in `app.py` (line with `app.run(...)`) and update `application.properties` in backend

### Backend Issues
- **Port 8080 already in use**: Change in `Backend/src/main/resources/application.properties` (line `server.port=8080`)
- **Can't find ML service**: Ensure ML service is running on port 5000 and update `ml.service.url` in `application.properties`
- **Compilation errors**: Ensure Java 21 is installed: `java -version`

### Frontend Issues
- **Can't connect to backend**: Verify backend is running on port 8080 and check network connectivity
- **Symptoms not being sent**: Ensure you're entering symptoms separated by commas (e.g., "fever, cough, headache")

---

## File Structure

```
AarogyaMitra/
├── ml_services/Disease_Prediction/
│   ├── Models/
│   │   ├── xgboost_disease_model.joblib
│   │   ├── all_symptoms.joblib
│   │   └── label_encoder.joblib
│   ├── app.py                           # Flask API server
│   ├── requirements.txt                 # Python dependencies
│   └── venv/                            # Virtual environment (created on first setup)
│
├── Backend/
│   ├── src/main/java/com/aarogyamitra/backend/
│   │   ├── controller/
│   │   │   └── DiseaseController.java   # API endpoints
│   │   ├── service/
│   │   │   └── DiseaseService.java      # Business logic
│   │   ├── dto/
│   │   │   ├── DiseaseSymptomRequest.java
│   │   │   └── DiseaseSymptomResponse.java
│   │   └── BackendApplication.java
│   ├── src/main/resources/
│   │   └── application.properties       # Spring Boot config
│   ├── pom.xml                          # Maven dependencies
│   ├── mvnw/mvnw.cmd                    # Maven Wrapper
│   └── target/                          # Build artifacts
│
└── frontend-mobile/
    ├── app/
    │   ├── disease-prediction.tsx       # Disease prediction screen
    │   ├── index.tsx                    # Landing page (updated)
    │   └── _layout.tsx                  # Router config (updated)
    ├── components/
    ├── lib/
    ├── package.json
    └── tsconfig.json
```

---

## Next Steps

1. Test the complete flow end-to-end
2. Customize symptom lists as needed
3. Add more disease models for better accuracy
4. Integrate with healthcare databases for verified results
5. Add result caching and logging for analytics

---

## Notes

- The disease prediction is for informational purposes only; always consult a healthcare professional
- Model accuracy depends on the training data and symptoms provided
- Ensure all three services are running before using the frontend
