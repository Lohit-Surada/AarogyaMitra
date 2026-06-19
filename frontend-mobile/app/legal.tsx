import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Spacing, Radius, HEADER_PADDING_TOP } from '@/constants/theme';

export default function LegalScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();

  const getTitle = () => {
    switch (type) {
      case 'terms': return 'Terms & Conditions';
      case 'privacy': return 'Privacy Policy';
      case 'refund': return 'Cancellation & Refund Policy';
      default: return 'Legal Information';
    }
  };

  const getContent = () => {
    switch (type) {
      case 'terms':
        return `Terms and Conditions for AarogyaMitra\n\n1. Acceptance of Terms\nBy using the AarogyaMitra application, you agree to these Terms and Conditions.\n\n2. Pharmacy Orders\nAll medicine orders must be accompanied by a valid prescription where required by law. We reserve the right to cancel any order if the prescription is invalid or missing.\n\n3. Payment & Pricing\nAll payments are processed securely via our payment gateway (Razorpay). Prices may change without prior notice.\n\n4. Limitation of Liability\nAarogyaMitra provides health information and tools for convenience only and is not a substitute for professional medical advice.`;
      case 'privacy':
        return `Privacy Policy for AarogyaMitra\n\n1. Information Collection\nWe collect personal information such as your name, email, phone number, and delivery address to process your pharmacy orders.\n\n2. Location Data\nWe collect location data to provide you with directions to nearby hospitals and pharmacies. Location tracking only occurs while using these features.\n\n3. Data Security\nYour data is securely stored. We do not sell your personal data to third parties.\n\n4. Payment Information\nWe do not store your credit card details. All transactions are securely processed by Razorpay.`;
      case 'refund':
        return `Cancellation & Refund Policy\n\n1. Cancellations\nYou may cancel your order at any time before the order status changes to 'SHIPPED'. Once shipped, orders cannot be cancelled.\n\n2. Refunds\nIf you cancel an order that was paid online, the refund will be processed to your original payment method within 5-7 business days.\n\n3. Returns\nWe do not accept returns for medicines due to health and safety regulations. If you receive a damaged or incorrect product, please contact support within 24 hours.`;
      default:
        return 'Please select a legal document to view.';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.bodyText}>{getContent()}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
  },
  contentContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: Palette.text,
  },
});
