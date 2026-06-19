const fs = require('fs');
const path = require('path');

const SYMPTOMS_LIST = [
  "itching", "skin_rash", "nodal_skin_eruptions", "continuous_sneezing", "shivering", "chills", "joint_pain", "stomach_pain", "acidity", "ulcers_on_tongue", "muscle_wasting", "vomiting", "burning_micturition", "spotting_ urination", "fatigue", "weight_gain", "anxiety", "cold_hands_and_feets", "mood_swings", "weight_loss", "restlessness", "lethargy", "patches_in_throat", "irregular_sugar_level", "cough", "high_fever", "sunken_eyes", "breathlessness", "sweating", "dehydration", "indigestion", "headache", "yellowish_skin", "dark_urine", "nausea", "loss_of_appetite", "pain_behind_the_eyes", "back_pain", "constipation", "abdominal_pain", "diarrhoea", "mild_fever", "yellow_urine", "yellowing_of_eyes", "acute_liver_failure", "fluid_overload", "swelling_of_stomach", "swelled_lymph_nodes", "malaise", "blurred_and_distorted_vision", "phlegm", "throat_irritation", "redness_of_eyes", "sinus_pressure", "runny_nose", "congestion", "chest_pain", "weakness_in_limbs", "fast_heart_rate", "pain_during_bowel_movements", "pain_in_anal_region", "bloody_stool", "irritation_in_anus", "neck_pain", "dizziness", "cramps", "bruising", "obesity", "swollen_legs", "swollen_blood_vessels", "puffy_face_and_eyes", "enlarged_thyroid", "brittle_nails", "swollen_extremeties", "excessive_hunger", "extra_marital_contacts", "drying_and_tingling_lips", "slurred_speech", "knee_pain", "hip_joint_pain", "muscle_weakness", "stiff_neck", "swelling_joints", "movement_stiffness", "spinning_movements", "loss_of_balance", "unsteadiness", "weakness_of_one_body_side", "loss_of_smell", "bladder_discomfort", "foul_smell_of urine", "continuous_feel_of_urine", "passage_of_gases", "internal_itching", "toxic_look_(typhos)", "depression", "irritability", "muscle_pain", "altered_sensorium", "red_spots_over_body", "belly_pain", "abnormal_menstruation", "dischromic _patches", "watering_from_eyes", "increased_appetite", "polyuria", "family_history", "mucoid_sputum", "rusty_sputum", "lack_of_concentration", "visual_disturbances", "receiving_blood_transfusion", "receiving_unsterile_injections", "coma", "stomach_bleeding", "distention_of_abdomen", "history_of_alcohol_consumption", "fluid_overload.1", "blood_in_sputum", "prominent_veins_on_calf", "palpitations", "painful_walking", "pus_filled_pimples", "blackheads", "scurring", "skin_peeling", "silver_like_dusting", "small_dents_in_nails", "inflammatory_nails", "blister", "red_sore_around_nose", "yellow_crust_ooze"
];

const DISEASES_LIST = [
  "Fungal infection", "Allergy", "GERD", "Chronic cholestasis", "Drug Reaction", "Peptic ulcer diseae", "AIDS", "Diabetes ", "Gastroenteritis", "Bronchial Asthma", "Hypertension ", "Migraine", "Cervical spondylosis", "Paralysis (brain hemorrhage)", "Jaundice", "Malaria", "Chicken pox", "Dengue", "Typhoid", "hepatitis A", "Hepatitis B", "Hepatitis C", "Hepatitis D", "Hepatitis E", "Alcoholic hepatitis", "Tuberculosis", "Common Cold", "Pneumonia", "Dimorphic hemmorhoids(piles)", "Heart attack", "Varicose veins", "Hypothyroidism", "Hyperthyroidism", "Hypoglycemia", "Osteoarthristis", "Arthritis", "(vertigo) Paroymsal  Positional Vertigo", "Acne", "Urinary tract infection", "Psoriasis", "Impetigo"
];

async function translate() {
  console.log('Translating symptoms and diseases to Telugu using Groq AI...');
  
  const payload = {
    message: `Translate the following list of symptoms and diseases to Telugu. Return ONLY a valid JSON object where the keys are the exact English strings provided, and the values are the Telugu translations. Do not include markdown formatting or backticks. Just the raw JSON object.
    
Symptoms:
${JSON.stringify(SYMPTOMS_LIST)}

Diseases:
${JSON.stringify(DISEASES_LIST)}
`,
    history: []
  };

  try {
    const res = await fetch('https://aarogyamitra-14.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    let reply = data.reply.trim();
    if (reply.startsWith('```json')) reply = reply.slice(7);
    if (reply.startsWith('```')) reply = reply.slice(3);
    if (reply.endsWith('```')) reply = reply.slice(0, -3);
    
    const translatedDict = JSON.parse(reply);

    // Read current te.json
    const tePath = path.join(__dirname, 'frontend-mobile/locales/te.json');
    const teData = JSON.parse(fs.readFileSync(tePath, 'utf8'));

    // Read current en.json
    const enPath = path.join(__dirname, 'frontend-mobile/locales/en.json');
    const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

    teData.translation.symptoms = {};
    teData.translation.diseases = {};
    enData.translation.symptoms = {};
    enData.translation.diseases = {};

    for (const sym of SYMPTOMS_LIST) {
      teData.translation.symptoms[sym] = translatedDict[sym] || sym;
      enData.translation.symptoms[sym] = sym.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    for (const dis of DISEASES_LIST) {
      teData.translation.diseases[dis] = translatedDict[dis] || dis;
      enData.translation.diseases[dis] = dis;
    }

    // Add remaining missing labels
    teData.translation.possibleCondition = "సాధ్యమైన పరిస్థితి";
    teData.translation.aiConfidence = "AI విశ్వాసం";
    teData.translation.analysisComplete = "విశ్లేషణ పూర్తయింది";
    teData.translation.warningMsg = "ఈ AI విశ్లేషణ కేవలం సమాచారం కోసం మాత్రమే మరియు వృత్తిపరమైన వైద్య సలహా లేదా రోగనిర్ధారణకు ప్రత్యామ్నాయం కాదు. ఆరోగ్య సమస్యల కోసం ఎల్లప్పుడూ వైద్యుడిని సంప్రదించండి.";
    
    enData.translation.possibleCondition = "Possible Condition";
    enData.translation.aiConfidence = "AI Confidence";
    enData.translation.analysisComplete = "Analysis Complete";
    enData.translation.warningMsg = "This AI analysis is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult a doctor for health concerns.";

    fs.writeFileSync(tePath, JSON.stringify(teData, null, 2));
    fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
    
    console.log('Successfully updated en.json and te.json!');
  } catch (e) {
    console.error('Error during translation:', e);
  }
}

translate();
