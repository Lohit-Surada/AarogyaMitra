import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';

export default function DiseasePredictionScreen() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handlePredict = async () => {
    if (!symptoms.trim()) {
      setErrorMsg('Please enter at least one symptom.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    setPrediction(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const apiUrl = 'https://aarogyamitra-13.onrender.com/api/predict-disease';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s.length > 0),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Prediction failed');

      setPrediction(data);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setErrorMsg('Service is waking up. Please wait 30-60s and try again.');
      } else {
        setErrorMsg(error.message || 'Analysis failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSymptoms('');
    setPrediction(null);
    setErrorMsg('');
  };

  const QUICK_SYMPTOMS = ['Fever', 'Cough', 'Headache', 'Fatigue', 'Nausea'];

  const addQuickSymptom = (sym: string) => {
    setSymptoms(prev => {
      const parts = prev.split(',').map(p => p.trim()).filter(p => p.length > 0);
      if (!parts.includes(sym)) {
        parts.push(sym);
        return parts.join(', ');
      }
      return prev;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Symptom Checker</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name="pulse" size={20} color={Palette.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Describe Symptoms</Text>
                <Text style={styles.cardSub}>Enter your symptoms separated by commas to receive an AI-powered preliminary analysis.</Text>
              </View>
            </View>

            <TextInput
              style={[styles.input, errorMsg ? { borderColor: Palette.danger } : null]}
              placeholder="e.g., fever, dry cough, body ache"
              placeholderTextColor={Palette.textMuted}
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />

            {errorMsg ? (
              <Text style={styles.errorTxt}>{errorMsg}</Text>
            ) : null}

            <Text style={styles.quickTitle}>Common Symptoms</Text>
            <View style={styles.quickRow}>
              {QUICK_SYMPTOMS.map(sym => (
                <TouchableOpacity key={sym} style={styles.quickChip} onPress={() => addQuickSymptom(sym)}>
                  <Text style={styles.quickChipTxt}>+ {sym}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear} disabled={loading}>
                <Text style={styles.clearBtnTxt}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.analyzeBtn} onPress={handlePredict} disabled={loading || !symptoms.trim()}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.analyzeBtnTxt}>Analyze Now</Text>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {prediction && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.resultIconBox}>
                  <Ionicons name="medkit" size={24} color="#059669" />
                </View>
                <Text style={styles.resultTitle}>Analysis Complete</Text>
              </View>

              <View style={styles.resultBody}>
                <Text style={styles.resultLbl}>Possible Condition</Text>
                <Text style={styles.resultDisease}>{prediction.disease || 'Unknown'}</Text>

                {prediction.confidence && (
                  <View style={{ marginTop: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={styles.resultLbl}>AI Confidence</Text>
                      <Text style={styles.confVal}>{(prediction.confidence * 100).toFixed(1)}%</Text>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.bar, { width: `${prediction.confidence * 100}%` }]} />
                    </View>
                  </View>
                )}

                {prediction.message && (
                  <View style={styles.msgBox}>
                    <Ionicons name="information-circle" size={20} color="#0284C7" />
                    <Text style={styles.msgTxt}>{prediction.message}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color="#B45309" />
            <Text style={styles.warningTxt}>
              This AI analysis is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult a doctor for health concerns.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: Palette.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Palette.text },

  container: { padding: Spacing.md, paddingBottom: 60 },

  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Palette.border, ...Shadows.sm },
  cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Palette.text },
  cardSub: { fontSize: 13, color: Palette.textMuted, marginTop: 4, lineHeight: 18 },

  input: {
    backgroundColor: '#F8FAFC', borderRadius: Radius.md, padding: 16, fontSize: 15,
    color: Palette.text, borderWidth: 1, borderColor: Palette.border, minHeight: 120,
  },
  errorTxt: { color: Palette.danger, fontSize: 12, marginTop: 8, fontWeight: '600' },

  quickTitle: { fontSize: 13, fontWeight: '700', color: Palette.text, marginTop: 16, marginBottom: 8 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.round, borderWidth: 1, borderColor: '#E2E8F0' },
  quickChipTxt: { fontSize: 12, fontWeight: '600', color: '#475569' },

  actionRow: { flexDirection: 'row', gap: 12 },
  clearBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center', backgroundColor: '#F1F5F9' },
  clearBtnTxt: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  analyzeBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: Radius.md, backgroundColor: Palette.primary, gap: 8 },
  analyzeBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },

  resultCard: {
    backgroundColor: '#ECFDF5', borderRadius: Radius.lg, marginTop: Spacing.lg,
    borderWidth: 2, borderColor: '#A7F3D0', overflow: 'hidden',
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: '#D1FAE5', gap: 10 },
  resultIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 16, fontWeight: '800', color: '#065F46' },
  resultBody: { padding: Spacing.md },
  resultLbl: { fontSize: 13, fontWeight: '600', color: '#047857', textTransform: 'uppercase', letterSpacing: 0.5 },
  resultDisease: { fontSize: 26, fontWeight: '800', color: '#064E3B', marginTop: 4, textTransform: 'capitalize' },
  confVal: { fontSize: 14, fontWeight: '800', color: '#059669' },
  track: { height: 8, backgroundColor: '#A7F3D0', borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: '#059669', borderRadius: 4 },
  msgBox: { flexDirection: 'row', backgroundColor: '#E0F2FE', padding: 12, borderRadius: Radius.md, marginTop: 20, gap: 10 },
  msgTxt: { flex: 1, fontSize: 13, color: '#0369A1', lineHeight: 18 },

  warningBox: { flexDirection: 'row', backgroundColor: '#FEF3C7', padding: Spacing.md, borderRadius: Radius.md, marginTop: Spacing.lg, gap: 12 },
  warningTxt: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
});
