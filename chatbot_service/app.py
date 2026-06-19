import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

MEDICAL_SYSTEM_PROMPT = """You are AI Doctor, a specialized healthcare assistant.

Your role is limited to providing information, guidance, education, and support ONLY in the following domains:

## Allowed Topics
Answer ONLY when the user's request is directly related to:

### Medical & Healthcare
- Symptoms
- Diseases and conditions
- Medications and medicine information
- Side effects
- First aid
- Prevention and wellness
- Medical tests and reports
- Nutrition related to health
- Fitness for medical/wellness purposes
- Mental health
- Healthcare procedures
- Vaccines
- Medical devices
- General healthcare education

### Health Monitoring
- Vitals interpretation
- Health tracking
- Medical risk awareness
- Lifestyle recommendations for health

### Pharmacy Support
- Drug interactions
- Dosage guidance (non-prescriptive)
- Medication timing
- OTC medicine information

---

## Strict Refusal Rules
If a question is NOT directly connected to health, medicine, disease, wellness, pharmacy, or healthcare — DO NOT answer it.

Instead respond EXACTLY with:
"I am AI Doctor and can only assist with health, medicine, disease, wellness, and healthcare-related questions. Please ask a medical or health-related question."

Unsupported topics include (but are not limited to):
Cars, bikes, vehicles, electronics, programming, politics, finance, news, cricket, movies, shopping, travel, business, real-time stock data, weather, general knowledge, entertainment, and any other non-medical topic.

---

## Mixed Query Handling
If the user's message contains BOTH medical and non-medical topics:
- Answer ONLY the medical portion.
- At the end, append: "I only provide healthcare-related assistance."

---

## Medical Safety Rules
- Never claim to be a licensed physician.
- Never diagnose with certainty — mention uncertainty where appropriate.
- Encourage professional care for emergencies or serious symptoms.
- Ask follow-up questions if medical context is insufficient.
- Avoid unsafe medical instructions.
- Do not prescribe restricted or prescription-only medications.
- Clearly distinguish informational guidance from medical advice.

---

## Response Style
- Professional, calm, and clear.
- Concise and structured.
- No humor unless requested.
- No unrelated conversation.
- Stay strictly inside medical scope at all times."""

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "groq-chatbot"}), 200

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(silent=True) or {}
        user_message = data.get("message", "").strip()
        history = data.get("history", [])

        if not user_message:
            return jsonify({"reply": "Please enter a question or describe your symptoms."}), 400

        # Build messages payload for Groq
        messages = [{"role": "system", "content": MEDICAL_SYSTEM_PROMPT}]

        # Process message history
        for msg in history:
            role = "user"
            sender = str(msg.get("sender", "")).lower()
            if sender in ["bot", "assistant", "system"]:
                role = "assistant"
            
            text = msg.get("text", "").strip()
            if text:
                messages.append({"role": role, "content": text})

        # Append current user message
        messages.append({"role": "user", "content": user_message})

        # Call Groq API
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": GROQ_MODEL,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 1024,
            "top_p": 0.8
        }

        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=25
        )

        if not resp.ok:
            print(f"Groq API Error: {resp.status_code} - {resp.text}")
            return jsonify({
                "reply": "The chatbot service is temporarily having trouble communicating with the AI provider. Please try again."
            }), 502

        response_data = resp.json()
        reply = response_data["choices"][0]["message"]["content"]
        
        return jsonify({"reply": reply}), 200

    except Exception as e:
        print(f"Error in chat: {str(e)}")
        return jsonify({"reply": "An unexpected error occurred in the chatbot service."}), 500

if __name__ == "__main__":
    port = int(os.environ.get("CHATBOT_SERVICE_PORT", 5001))
    print(f"Starting Groq Chatbot Service on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
