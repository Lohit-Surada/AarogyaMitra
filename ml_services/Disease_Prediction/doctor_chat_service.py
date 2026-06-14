# Service to call Flask backend for advanced medical queries
import requests

def ask_flask_backend(user_message: str) -> str:
    try:
        resp = requests.post(
            'http://localhost:5000/api/doctor-chat',
            json={'message': user_message},
            timeout=10
        )
        if resp.ok:
            data = resp.json()
            return data.get('reply', 'No answer from ML doctor.')
        return 'Flask ML service error.'
    except Exception as e:
        return f'Error contacting ML service: {str(e)}'
