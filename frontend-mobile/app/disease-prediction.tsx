import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import Constants from 'expo-constants';

export default function DiseasePredictionScreen() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!symptoms.trim()) {
      Alert.alert('Error', 'Please enter symptoms');
      return;
    }

    setLoading(true);
    try {
      // AbortController for request timeout (10 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Use the deployed Render ML service URL
      const apiUrl = 'https://aarogyamitra-13.onrender.com/api/predict-disease';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!data.success) {
        throw new Error(data.error || 'Prediction failed on the server');
      }

      setPrediction(data);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        Alert.alert(
          'Connection Timeout',
          'The ML service did not respond in time. Make sure the Flask disease-prediction server is running on port 5000.\n\nRun: python ml_services/Disease_Prediction/app.py'
        );
      } else {
        Alert.alert(
          'Prediction Failed',
          `${error.message}\n\nEnsure the Flask ML server is running:\npython ml_services/Disease_Prediction/app.py`
        );
      }
      console.log('Prediction error:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSymptoms('');
    setPrediction(null);
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          backgroundColor: '#ffffff',
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: '#111827' }}>← Back</Text>
        </TouchableOpacity>
        <ThemedText
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            marginTop: 8,
            color: '#111827',
          }}
        >
          Disease Prediction
        </ThemedText>
        <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
          Enter your symptoms to predict possible diseases
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 20,
        }}
      >
        {/* Symptoms Input Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
            Enter Symptoms
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
            Separate multiple symptoms with commas (e.g., fever, cough, headache)
          </Text>
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: '#e5e7eb',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 14,
              color: '#111827',
              backgroundColor: '#f8fafc',
              minHeight: 100,
              textAlignVertical: 'top',
            }}
            placeholder="e.g., fever, cough, headache, fatigue"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={5}
            value={symptoms}
            onChangeText={setSymptoms}
            editable={!loading}
          />
        </View>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={handlePredict}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: loading ? '#9ca3af' : '#22c55e',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                Predict
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClear}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: '#e5e7eb',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#111827', fontSize: 16, fontWeight: '600' }}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        {/* Prediction Results */}
        {prediction && (
          <View
            style={{
              backgroundColor: '#f0fdf4',
              borderLeftWidth: 4,
              borderLeftColor: '#22c55e',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
              Prediction Result
            </Text>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                Disease
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#22c55e',
                  textTransform: 'capitalize',
                }}
              >
                {prediction.disease || 'Unknown'}
              </Text>
            </View>

            {prediction.confidence && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                  Confidence Score
                </Text>
                <View
                  style={{
                    height: 8,
                    backgroundColor: '#e5e7eb',
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: 4,
                  }}
                >
                  <View
                    style={{
                      width: `${(prediction.confidence * 100).toFixed(1)}%`,
                      height: '100%',
                      backgroundColor: '#22c55e',
                    }}
                  />
                </View>
                <Text style={{ fontSize: 12, color: '#111827', fontWeight: '600' }}>
                  {(prediction.confidence * 100).toFixed(2)}%
                </Text>
              </View>
            )}

            {prediction.message && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#d1fae5' }}>
                <Text style={{ fontSize: 13, color: '#059669', lineHeight: 20 }}>
                  {prediction.message}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Info Section */}
        <View
          style={{
            backgroundColor: '#eff6ff',
            borderRadius: 8,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#3b82f6',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e40af', marginBottom: 8 }}>
            💡 Tips
          </Text>
          <Text style={{ fontSize: 13, color: '#1e40af', lineHeight: 20 }}>
            • Enter symptoms separated by commas{'\n'}
            • Be specific with your symptoms{'\n'}
            • This is for informational purposes only{'\n'}
            • Consult a healthcare professional for medical advice
          </Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
