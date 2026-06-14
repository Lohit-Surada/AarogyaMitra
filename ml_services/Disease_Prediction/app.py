from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os


app = Flask(__name__)
CORS(app)

# Get the directory where this script is located.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "Models")

print(f"Loading models from: {MODELS_DIR}")

try:
    model_path = os.path.join(MODELS_DIR, "xgboost_disease_model.joblib")
    disease_model = joblib.load(model_path)
    print(f"[OK] Loaded disease model from {model_path}")

    symptoms_path = os.path.join(MODELS_DIR, "all_symptoms.joblib")
    all_symptoms = joblib.load(symptoms_path)
    print(f"[OK] Loaded all symptoms from {symptoms_path}")

    encoder_path = os.path.join(MODELS_DIR, "label_encoder.joblib")
    label_encoder = joblib.load(encoder_path)
    print(f"[OK] Loaded label encoder from {encoder_path}")

    models_loaded = True
except Exception as e:
    print(f"[ERROR] Error loading models: {str(e)}")
    disease_model = None
    all_symptoms = []
    label_encoder = None
    models_loaded = False


@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "healthy",
            "models_loaded": models_loaded,
            "available_symptoms_count": len(all_symptoms) if models_loaded else 0,
        }
    ), 200


@app.route("/api/predict-disease", methods=["POST"])
def predict_disease():
    try:
        if not models_loaded:
            return jsonify({"error": "Models not loaded", "success": False}), 500

        data = request.get_json()

        if not data or "symptoms" not in data:
            return jsonify(
                {"error": "Please provide symptoms in the request", "success": False}
            ), 400

        user_symptoms = data.get("symptoms", [])
        user_symptoms = [s.lower().strip() for s in user_symptoms if s.strip()]

        if not user_symptoms:
            return jsonify(
                {"error": "At least one symptom is required", "success": False}
            ), 400

        input_vector = np.zeros(len(all_symptoms))
        known_symptoms_lower = [sym.lower() for sym in all_symptoms]

        for i, symptom in enumerate(all_symptoms):
            if symptom.lower() in user_symptoms:
                input_vector[i] = 1

        prediction = disease_model.predict([input_vector])[0]
        probabilities = disease_model.predict_proba([input_vector])[0]
        confidence = float(np.max(probabilities))
        disease_name = label_encoder.inverse_transform([prediction])[0]

        matched_symptoms = [s for s in user_symptoms if s in known_symptoms_lower]
        unmatched_symptoms = [s for s in user_symptoms if s not in known_symptoms_lower]

        return jsonify(
            {
                "success": True,
                "disease": disease_name,
                "confidence": confidence,
                "matched_symptoms": matched_symptoms,
                "unmatched_symptoms": unmatched_symptoms,
                "message": (
                    "Based on the provided symptoms, the predicted disease is "
                    f"{disease_name} with {confidence * 100:.2f}% confidence. "
                    "Please consult a healthcare professional for accurate diagnosis."
                ),
            }
        ), 200

    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return jsonify({"error": f"Prediction failed: {str(e)}", "success": False}), 500


@app.route("/api/symptoms", methods=["GET"])
def get_symptoms():
    try:
        if not models_loaded:
            return jsonify({"error": "Models not loaded", "success": False}), 500

        return jsonify(
            {
                "success": True,
                "symptoms": sorted([s.lower() for s in all_symptoms]),
                "count": len(all_symptoms),
            }
        ), 200

    except Exception as e:
        print(f"Error fetching symptoms: {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500


@app.route("/api/doctor-chat", methods=["POST"])
def doctor_chat():
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"reply": "Please enter a question or describe your symptoms."}), 400

    return jsonify(
        {
            "reply": (
                "I can help with general health guidance, but I cannot diagnose you. "
                "For a prediction, enter comma-separated symptoms in the disease "
                "prediction screen. For urgent or severe symptoms, contact a medical "
                "professional immediately."
            )
        }
    )


if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("Disease Prediction ML API Server")
    print("=" * 50)
    print(
        f"Status: {'[OK] Models loaded successfully' if models_loaded else '[ERROR] Failed to load models'}"
    )
    print(f"Available symptoms: {len(all_symptoms) if models_loaded else 'N/A'}")
    print("Starting server on http://localhost:5000")
    print("=" * 50 + "\n")

    debug_enabled = os.environ.get("FLASK_DEBUG") == "1"
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=debug_enabled, host="0.0.0.0", port=port)
