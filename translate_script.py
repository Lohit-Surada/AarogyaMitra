import json
import os
import asyncio
from googletrans import Translator

SYMPTOMS_LIST = [
  "itching", "skin_rash", "nodal_skin_eruptions", "continuous_sneezing", "shivering", "chills", "joint_pain", "stomach_pain", "acidity", "ulcers_on_tongue", "muscle_wasting", "vomiting", "burning_micturition", "spotting_ urination", "fatigue", "weight_gain", "anxiety", "cold_hands_and_feets", "mood_swings", "weight_loss", "restlessness", "lethargy", "patches_in_throat", "irregular_sugar_level", "cough", "high_fever", "sunken_eyes", "breathlessness", "sweating", "dehydration", "indigestion", "headache", "yellowish_skin", "dark_urine", "nausea", "loss_of_appetite", "pain_behind_the_eyes", "back_pain", "constipation", "abdominal_pain", "diarrhoea", "mild_fever", "yellow_urine", "yellowing_of_eyes", "acute_liver_failure", "fluid_overload", "swelling_of_stomach", "swelled_lymph_nodes", "malaise", "blurred_and_distorted_vision", "phlegm", "throat_irritation", "redness_of_eyes", "sinus_pressure", "runny_nose", "congestion", "chest_pain", "weakness_in_limbs", "fast_heart_rate", "pain_during_bowel_movements", "pain_in_anal_region", "bloody_stool", "irritation_in_anus", "neck_pain", "dizziness", "cramps", "bruising", "obesity", "swollen_legs", "swollen_blood_vessels", "puffy_face_and_eyes", "enlarged_thyroid", "brittle_nails", "swollen_extremeties", "excessive_hunger", "extra_marital_contacts", "drying_and_tingling_lips", "slurred_speech", "knee_pain", "hip_joint_pain", "muscle_weakness", "stiff_neck", "swelling_joints", "movement_stiffness", "spinning_movements", "loss_of_balance", "unsteadiness", "weakness_of_one_body_side", "loss_of_smell", "bladder_discomfort", "foul_smell_of urine", "continuous_feel_of_urine", "passage_of_gases", "internal_itching", "toxic_look_(typhos)", "depression", "irritability", "muscle_pain", "altered_sensorium", "red_spots_over_body", "belly_pain", "abnormal_menstruation", "dischromic _patches", "watering_from_eyes", "increased_appetite", "polyuria", "family_history", "mucoid_sputum", "rusty_sputum", "lack_of_concentration", "visual_disturbances", "receiving_blood_transfusion", "receiving_unsterile_injections", "coma", "stomach_bleeding", "distention_of_abdomen", "history_of_alcohol_consumption", "fluid_overload.1", "blood_in_sputum", "prominent_veins_on_calf", "palpitations", "painful_walking", "pus_filled_pimples", "blackheads", "scurring", "skin_peeling", "silver_like_dusting", "small_dents_in_nails", "inflammatory_nails", "blister", "red_sore_around_nose", "yellow_crust_ooze"
]

DISEASES_LIST = [
  "Fungal infection", "Allergy", "GERD", "Chronic cholestasis", "Drug Reaction", "Peptic ulcer diseae", "AIDS", "Diabetes ", "Gastroenteritis", "Bronchial Asthma", "Hypertension ", "Migraine", "Cervical spondylosis", "Paralysis (brain hemorrhage)", "Jaundice", "Malaria", "Chicken pox", "Dengue", "Typhoid", "hepatitis A", "Hepatitis B", "Hepatitis C", "Hepatitis D", "Hepatitis E", "Alcoholic hepatitis", "Tuberculosis", "Common Cold", "Pneumonia", "Dimorphic hemmorhoids(piles)", "Heart attack", "Varicose veins", "Hypothyroidism", "Hyperthyroidism", "Hypoglycemia", "Osteoarthristis", "Arthritis", "(vertigo) Paroymsal  Positional Vertigo", "Acne", "Urinary tract infection", "Psoriasis", "Impetigo"
]

async def translate_dict():
    translator = Translator()
    
    # Read existing
    base_dir = os.path.dirname(os.path.abspath(__file__))
    te_path = os.path.join(base_dir, 'frontend-mobile', 'locales', 'te.json')
    en_path = os.path.join(base_dir, 'frontend-mobile', 'locales', 'en.json')
    
    with open(te_path, 'r', encoding='utf-8') as f:
        te_data = json.load(f)
    with open(en_path, 'r', encoding='utf-8') as f:
        en_data = json.load(f)
        
    te_data['translation']['symptoms'] = {}
    te_data['translation']['diseases'] = {}
    en_data['translation']['symptoms'] = {}
    en_data['translation']['diseases'] = {}
    
    print("Translating symptoms...")
    for sym in SYMPTOMS_LIST:
        clean_en = sym.replace('_', ' ').title()
        en_data['translation']['symptoms'][sym] = clean_en
        try:
            res = await translator.translate(clean_en, dest='te')
            te_data['translation']['symptoms'][sym] = res.text
        except Exception as e:
            print(f"Failed to translate {sym}")
            te_data['translation']['symptoms'][sym] = clean_en
            
    print("Translating diseases...")
    for dis in DISEASES_LIST:
        clean_en = dis.strip()
        en_data['translation']['diseases'][dis] = clean_en
        try:
            res = await translator.translate(clean_en, dest='te')
            te_data['translation']['diseases'][dis] = res.text
        except:
            te_data['translation']['diseases'][dis] = clean_en

    # Additional labels
    te_data['translation']['possibleCondition'] = "సాధ్యమైన పరిస్థితి"
    te_data['translation']['aiConfidence'] = "AI విశ్వాసం"
    te_data['translation']['analysisComplete'] = "విశ్లేషణ పూర్తయింది"
    te_data['translation']['warningMsg'] = "ఈ AI విశ్లేషణ కేవలం సమాచారం కోసం మాత్రమే మరియు వృత్తిపరమైన వైద్య సలహా లేదా రోగనిర్ధారణకు ప్రత్యామ్నాయం కాదు. ఆరోగ్య సమస్యల కోసం ఎల్లప్పుడూ వైద్యుడిని సంప్రదించండి."
    
    en_data['translation']['possibleCondition'] = "Possible Condition"
    en_data['translation']['aiConfidence'] = "AI Confidence"
    en_data['translation']['analysisComplete'] = "Analysis Complete"
    en_data['translation']['warningMsg'] = "This AI analysis is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult a doctor for health concerns."
            
    with open(te_path, 'w', encoding='utf-8') as f:
        json.dump(te_data, f, ensure_ascii=False, indent=2)
        
    with open(en_path, 'w', encoding='utf-8') as f:
        json.dump(en_data, f, ensure_ascii=False, indent=2)
        
    print("Translation complete!")

if __name__ == '__main__':
    asyncio.run(translate_dict())
