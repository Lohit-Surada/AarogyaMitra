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
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';
import { SYMPTOMS_LIST } from '@/constants/symptoms';
import { sendChatMessage } from '@/services/chatbotService';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '@/components/ui/LanguageToggle';

export default function DiseasePredictionScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [tips, setTips] = useState<string | null>(null);
  const [tipsLoading, setTipsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) {
      setErrorMsg('Please select at least one symptom.');
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
          symptoms: selectedSymptoms,
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

      setTipsLoading(true);
      setTips(null);
      try {
        const langStr = i18n.language === 'te' ? 'Telugu' : 'English';
        const prompt = `Give exactly 3 main tips to cure or manage the disease: ${data.disease}. Keep the total response strictly under 10 lines. Do NOT ask any follow-up questions at the end. Do NOT add any conversational text. Please provide your entire response in ${langStr}.`;
        const reply = await sendChatMessage(prompt, []);
        setTips(reply);
      } catch (err) {
        console.error('[DiseasePrediction] Error fetching tips:', err);
      } finally {
        setTipsLoading(false);
      }
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
    setSelectedSymptoms([]);
    setPrediction(null);
    setErrorMsg('');
    setTips(null);
  };

  const QUICK_SYMPTOMS = ['fever', 'cough', 'headache', 'fatigue', 'nausea'];

  const addQuickSymptom = (sym: string) => {
    setSelectedSymptoms(prev => {
      if (!prev.includes(sym)) {
        return [...prev, sym];
      }
      return prev;
    });
  };

  const removeSymptom = (sym: string) => {
    setSelectedSymptoms(prev => prev.filter(s => s !== sym));
  };

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(sym)) {
        return prev.filter(s => s !== sym);
      }
      return [...prev, sym];
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('aiSymptomChecker')}</Text>
        <LanguageToggle />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name="pulse" size={20} color={Palette.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{t('describeSymptoms')}</Text>
                <Text style={styles.cardSub}>Select your symptoms from the list to receive an AI-powered preliminary analysis.</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.dropdownBtn, errorMsg ? { borderColor: Palette.danger } : null]} 
              onPress={() => setModalVisible(true)}
              disabled={loading}
            >
              <Text style={styles.dropdownBtnTxt}>
                {t('selectSymptoms')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Palette.textMuted} />
            </TouchableOpacity>

            {selectedSymptoms.length > 0 && (
              <View style={styles.selectedSymptomsContainer}>
                <Text style={styles.selectedSymptomsTitle}>{t('selectedSymptoms')}</Text>
                <View style={styles.selectedSymptomsList}>
                  {selectedSymptoms.map(sym => (
                    <View key={sym} style={styles.selectedChip}>
                      <Text style={styles.selectedChipTxt}>
                        {t(`symptoms.${sym}`, { defaultValue: sym.replace(/_/g, ' ') })}
                      </Text>
                      <TouchableOpacity onPress={() => removeSymptom(sym)}>
                        <Ionicons name="close-circle" size={16} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {errorMsg ? (
              <Text style={styles.errorTxt}>{errorMsg}</Text>
            ) : null}

            <Text style={styles.quickTitle}>{t('commonSymptoms')}</Text>
            <View style={styles.quickRow}>
              {QUICK_SYMPTOMS.map(sym => (
                <TouchableOpacity key={sym} style={styles.quickChip} onPress={() => addQuickSymptom(sym)}>
                  <Text style={styles.quickChipTxt}>
                    + {t(`symptoms.${sym}`, { defaultValue: sym.replace(/_/g, ' ') })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear} disabled={loading}>
                <Text style={styles.clearBtnTxt}>{t('clear')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.analyzeBtn} onPress={handlePredict} disabled={loading || selectedSymptoms.length === 0}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.analyzeBtnTxt}>{t('analyzeNow')}</Text>
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
                <Text style={styles.resultTitle}>{t('analysisComplete') || 'Analysis Complete'}</Text>
              </View>

              <View style={styles.resultBody}>
                <Text style={styles.resultLbl}>{t('possibleCondition') || 'Possible Condition'}</Text>
                <Text style={styles.resultDisease}>
                  {prediction.disease ? t(`diseases.${prediction.disease}`, { defaultValue: prediction.disease }) : 'Unknown'}
                </Text>

                {prediction.confidence && (
                  <View style={{ marginTop: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={styles.resultLbl}>{t('aiConfidence') || 'AI Confidence'}</Text>
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

          {prediction && (tipsLoading || tips) && (
            <View style={styles.blogCard}>
              <View style={styles.blogHeader}>
                <Ionicons name="leaf" size={22} color="#16A34A" />
                <Text style={styles.blogTitle}>{t('cureAndManagementTips')}</Text>
              </View>
              {tipsLoading ? (
                <View style={styles.tipsLoadingContainer}>
                  <ActivityIndicator color={Palette.primary} size="small" />
                  <Text style={styles.tipsLoadingTxt}>{t('generatingTips')}</Text>
                </View>
              ) : (
                <Text style={styles.blogContent}>{tips}</Text>
              )}
            </View>
          )}

          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color="#B45309" />
            <Text style={styles.warningTxt}>
              {t('warningMsg') || 'This AI analysis is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult a doctor for health concerns.'}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectSymptoms')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Palette.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchSymptoms')}
              placeholderTextColor={Palette.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={SYMPTOMS_LIST.filter(s => {
                const searchStr = t(`symptoms.${s}`, { defaultValue: s.replace(/_/g, ' ') }).toLowerCase();
                return searchStr.includes(searchQuery.toLowerCase()) || s.toLowerCase().includes(searchQuery.toLowerCase());
              })}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = selectedSymptoms.includes(item);
                return (
                  <TouchableOpacity style={styles.symptomItem} onPress={() => toggleSymptom(item)}>
                    <Text style={styles.symptomItemText}>
                      {t(`symptoms.${item}`, { defaultValue: item.replace(/_/g, ' ') })}
                    </Text>
                    <Ionicons 
                      name={isSelected ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={isSelected ? Palette.primary : Palette.textMuted} 
                    />
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
            <TouchableOpacity style={styles.doneBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.doneBtnTxt}>{t('done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: Radius.md, padding: 16, borderWidth: 1, borderColor: Palette.border },
  dropdownBtnTxt: { fontSize: 15, color: Palette.text },

  selectedSymptomsContainer: { marginTop: 16 },
  selectedSymptomsTitle: { fontSize: 13, fontWeight: '700', color: Palette.text, marginBottom: 8 },
  selectedSymptomsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.round, gap: 6 },
  selectedChipTxt: { fontSize: 13, fontWeight: '600', color: '#334155', textTransform: 'capitalize' },

  errorTxt: { color: Palette.danger, fontSize: 12, marginTop: 8, fontWeight: '600' },

  quickTitle: { fontSize: 13, fontWeight: '700', color: Palette.text, marginTop: 16, marginBottom: 8 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.round, borderWidth: 1, borderColor: '#E2E8F0' },
  quickChipTxt: { fontSize: 12, fontWeight: '600', color: '#475569', textTransform: 'capitalize' },

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

  blogCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.md, borderWidth: 1, borderColor: Palette.border, ...Shadows.sm },
  blogHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  blogTitle: { fontSize: 16, fontWeight: '700', color: Palette.text },
  tipsLoadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  tipsLoadingTxt: { fontSize: 14, color: Palette.textMuted },
  blogContent: { fontSize: 14, color: Palette.text, lineHeight: 22 },

  warningBox: { flexDirection: 'row', backgroundColor: '#FEF3C7', padding: Spacing.md, borderRadius: Radius.md, marginTop: Spacing.lg, gap: 12 },
  warningTxt: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, height: '80%', padding: Spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Palette.text },
  searchInput: { backgroundColor: '#F1F5F9', borderRadius: Radius.md, padding: 12, fontSize: 15, color: Palette.text, marginBottom: 12 },
  symptomItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Palette.border },
  symptomItemText: { fontSize: 16, color: Palette.text, textTransform: 'capitalize' },
  doneBtn: { backgroundColor: Palette.primary, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center', marginTop: 16 },
  doneBtnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
