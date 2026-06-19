import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Shadows } from '@/constants/theme';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'te' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const isTelugu = i18n.language === 'te';

  return (
    <TouchableOpacity style={styles.container} onPress={toggleLanguage} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        <Ionicons name="language" size={18} color={Palette.primary} />
      </View>
      <Text style={styles.text}>
        {isTelugu ? 'English' : 'తెలుగు'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.sm,
    gap: 8,
  },
  iconBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.round,
    padding: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
  },
});
