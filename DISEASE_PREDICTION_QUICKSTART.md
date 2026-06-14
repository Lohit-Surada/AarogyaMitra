# 🚀 Disease Prediction Module - Quick Start

## ✅ What's Been Built

### Frontend (Expo React Native)
- ✓ Disease prediction screen with symptom input form
- ✓ Real-time symptom entry (comma-separated)
- ✓ Beautiful results display with disease name & confidence score
- ✓ Navigation from home screen "Disease Prediction" card

### Spring Boot Backend
- ✓ REST API controller at `/api/predict-disease`
- ✓ Disease service that bridges to ML backend
- ✓ Health check endpoint
- ✓ CORS enabled for frontend access

### Python ML Service
- ✓ Flask API server loading XGBoost models
- ✓ Endpoints for predictions and symptom list
- ✓ Error handling and logging

---

## 🎯 3-Step Quick Start

### Step 1: Start ML Service (Python Flask)
```bash
cd ml_services/Disease_Prediction

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
python app.py
```
✓ Should see: "Starting server on http://192.168.1.5:5000"

---

### Step 2: Start Spring Boot Backend
```bash
cd Backend

./mvnw spring-boot:run
# Windows: mvnw.cmd spring-boot:run
```
✓ Should see: "Disease Prediction API available at: http://192.168.1.5:8016/api/predict-disease"

---

### Step 3: Start Frontend
```bash
cd frontend-mobile

npm start
```
✓ Open Expo Go on phone or use emulator, scan QR code

---

## 🧪 Test the Flow

1. Open app → Home screen
2. Click "Disease Prediction" card → "Predict" button
3. Enter symptoms: `fever, cough, headache` (comma-separated)
4. Click "Predict"
5. See disease prediction with confidence score!

---

## 📁 What's New

```
✨ Frontend
└── frontend-mobile/app/disease-prediction.tsx (new)

✨ Backend
├── Backend/src/main/java/com/aarogyamitra/backend/controller/DiseaseController.java (new)
├── Backend/src/main/java/com/aarogyamitra/backend/service/DiseaseService.java (new)
├── Backend/src/main/java/com/aarogyamitra/backend/dto/DiseaseSymptomRequest.java (new)
└── Backend/src/main/java/com/aarogyamitra/backend/dto/DiseaseSymptomResponse.java (new)

✨ ML Service
├── ml_services/Disease_Prediction/app.py (new)
├── ml_services/Disease_Prediction/requirements.txt (updated)

✨ Configuration
├── Backend/src/main/resources/application.properties (updated)
├── frontend-mobile/app/_layout.tsx (updated - added route)
├── frontend-mobile/app/index.tsx (updated - added navigation)
└── DISEASE_PREDICTION_SETUP.md (full documentation)
```

---

## 🔧 Configuration

**ML Service URL** (Backend → ML):
- File: `Backend/src/main/resources/application.properties`
- Property: `ml.service.url=http://192.168.1.5:5000`

**Backend Port** (Frontend → Backend):
- File: `Backend/src/main/resources/application.properties`
- Property: `server.port=8016`
- Change both if ports conflict

---

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| ML service won't start | Ensure Python 3.8+, `pip install -r requirements.txt` |
| Models not found | Check `ml_services/Disease_Prediction/Models/` has 3 joblib files |
| Backend can't find ML service | Ensure Flask running on port 5000, check `application.properties` |
| Frontend can't reach backend | Ensure Spring Boot running on 8080, check network |
| Port already in use | Change port in `application.properties` and update other configs |

---

## 📊 Example API Call

```bash
curl -X POST http://192.168.1.5:8016/api/predict-disease \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["fever", "cough", "fatigue"]
  }'
```

**Response:**
```json
{
  "success": true,
  "disease": "common_cold",
  "confidence": 0.87,
  "matched_symptoms": ["fever", "cough"],
  "unmatched_symptoms": ["fatigue"],
  "message": "Based on the provided symptoms, the predicted disease is common_cold with 87.00% confidence..."
}
```

---

## 📚 Full Documentation

For detailed setup, troubleshooting, and API reference:
👉 See `DISEASE_PREDICTION_SETUP.md`

---

## ✨ Next Features (Optional)

- [ ] Save prediction history per user
- [ ] Add more disease models
- [ ] Integrate with healthcare provider database
- [ ] Add real-time symptom suggestions
- [ ] Add severity assessment
- [ ] Export prediction reports

---

**All set! Run all 3 servers and enjoy the Disease Prediction module! 🎉**
