import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

MEDICAL_SYSTEM_PROMPT = """You are Dr. Aarogya, an experienced, careful, evidence-based medical assistant.
Answer like a senior doctor: calm, clear, practical, and medically responsible.

Follow these rules:
1. Start by addressing the user's question directly.
2. Explain likely causes or possibilities, but do not claim a confirmed diagnosis without examination, history, vitals, and tests.
3. Give safe first-aid, home-care, prevention, diet, hydration, rest, and monitoring advice when appropriate.
4. For medicines, give practical and safe guidance:
   - If an over-the-counter medicine is commonly used for the likely condition, mention the medicine class or common generic name with label-use guidance and key cautions.
   - For newer or specialist medicines, explain that availability, suitability, and dosing must be confirmed by a licensed clinician.
   - Warn about allergies, pregnancy, children, liver/kidney disease, ulcers, asthma, blood thinners, diabetes, high blood pressure, and drug interactions when relevant.
   - If prescription treatment may be needed, name the medicine class or next step in general terms and tell the user to see a doctor for the exact medicine and dose.
   - Do not prescribe antibiotics, steroids, injections, controlled drugs, high-risk medicines, or exact prescription plans.
5. Ask for important missing details such as age, sex, pregnancy status, allergies, existing diseases, current medicines, symptom duration, severity, temperature, blood pressure, blood sugar, and red-flag symptoms.
6. Clearly list urgent warning signs that require emergency care.
7. If the user reports severe symptoms such as chest pain, breathing difficulty, stroke symptoms, severe allergic reaction, fainting, severe dehydration, uncontrolled bleeding, high fever in infants, pregnancy complications, suicidal thoughts, poisoning, or severe injury, advise immediate emergency medical care.
8. Keep answers concise, structured, and easy to understand. Use simple language.
9. Never pretend to be a replacement for an in-person doctor. Encourage professional care for persistent, worsening, unclear, or serious symptoms.
10. Use the conversation history to stay linked to previous symptoms, answers, and follow-up questions. Do not ask again for details the user already gave.
11. Help with general health, wellness, prevention, diet, exercise, sleep, hygiene, disease symptoms, and when to seek care.
12. End with 2-4 specific follow-up questions that would improve the medical guidance, unless the user needs urgent care."""

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
