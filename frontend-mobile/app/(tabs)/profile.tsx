import React from 'react';
import { StyleSheet, View, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { PremiumCard } from '@/components/ui/PremiumCard';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const ProfileOption = ({ icon, label, onPress, color = Palette.primary }: { icon: any; label: string; onPress?: () => void; color?: string }) => (
    <Pressable style={styles.optionRow} onPress={onPress}>
      <View style={[styles.optionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <ThemedText style={styles.optionLabel}>{label}</ThemedText>
      <Ionicons name="chevron-forward" size={20} color={Palette.border} />
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Palette.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topActions}>
          <LanguageToggle />
        </View>

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={Palette.primary} />
          </View>
          <ThemedText style={styles.name}>{user?.email?.split('@')[0] || 'Guest User'}</ThemedText>
          <ThemedText style={styles.email}>{user?.email || 'guest@example.com'}</ThemedText>
        </View>

        <PremiumCard style={styles.card} noPadding>
          <ProfileOption icon="medical" label="My Health Records" />
          <View style={styles.divider} />
          <ProfileOption icon="calendar" label="Appointments" />
          <View style={styles.divider} />
          <ProfileOption icon="cart" label="Pharmacy Orders" onPress={() => router.push('/pharmacy/orders')} />
          <View style={styles.divider} />
          <ProfileOption icon="settings" label="Settings" />
        </PremiumCard>

        <PremiumCard style={[styles.card, { marginTop: Spacing.md }]} noPadding>
          <ProfileOption icon="help-circle" label="Help & Support" color={Palette.info} />
          <View style={styles.divider} />
          <ProfileOption icon="log-out" label="Logout" color={Palette.danger} onPress={handleLogout} />
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingTop: Spacing.xl,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Palette.text,
  },
  email: {
    fontSize: 14,
    color: Palette.textMuted,
    marginTop: 4,
  },
  card: {
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Palette.surface,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Palette.text,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.border,
    marginLeft: 60,
  },
});
