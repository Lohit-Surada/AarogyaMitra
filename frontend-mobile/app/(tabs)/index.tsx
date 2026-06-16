import React from 'react';
import { StyleSheet, View, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { HealthMetricCard } from '@/components/ui/HealthMetricCard';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const QuickAction = ({ icon, label, route, color }: { icon: any; label: string; route: string; color: string }) => (
    <Pressable style={styles.actionItem} onPress={() => router.push(route as any)}>
      <View style={[styles.actionIconWrap, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <ThemedText style={styles.actionLabel}>{label}</ThemedText>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Palette.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greeting}>Hello, {user?.email?.split('@')[0] || 'Guest'}</ThemedText>
            <ThemedText style={styles.subtitle}>How are you feeling today?</ThemedText>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color={Palette.danger} />
          </Pressable>
        </View>

        {/* Health Metrics Scroll */}
        <View style={styles.metricsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.md }}>
            <HealthMetricCard 
              title="Heart Rate" 
              value="72" 
              unit="bpm" 
              icon="heart" 
              color={Palette.danger} 
            />
            <HealthMetricCard 
              title="Steps" 
              value="6,432" 
              icon="walk" 
              color={Palette.info} 
            />
            <HealthMetricCard 
              title="Sleep" 
              value="7.5" 
              unit="hrs" 
              icon="moon" 
              color={Palette.primary} 
            />
          </ScrollView>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Services</ThemedText>
          <PremiumCard style={styles.gridCard} noPadding>
            <View style={styles.gridRow}>
              <QuickAction icon="chatbubbles" label="Chatbot" route="/chatbot" color={Palette.info} />
              <QuickAction icon="medical" label="Pharmacy" route="/pharmacy" color={Palette.secondary} />
              <QuickAction icon="scan" label="Diagnosis" route="/disease-prediction" color={Palette.primary} />
              <QuickAction icon="map" label="Hospitals" route="/maps" color={Palette.warning} />
            </View>
          </PremiumCard>
        </View>

        {/* Upcoming Appointment */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Upcoming</ThemedText>
          <PremiumCard style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <View style={styles.dateBox}>
                <ThemedText style={styles.dateMonth}>OCT</ThemedText>
                <ThemedText style={styles.dateDay}>24</ThemedText>
              </View>
              <View style={styles.appointmentInfo}>
                <ThemedText style={styles.doctorName}>Dr. Sarah Johnson</ThemedText>
                <ThemedText style={styles.doctorSpec}>General Physician</ThemedText>
                <ThemedText style={styles.appointmentTime}>10:00 AM - 10:30 AM</ThemedText>
              </View>
            </View>
          </PremiumCard>
        </View>

        {/* Padding for Bottom Tabs */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Palette.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textMuted,
    marginTop: 4,
  },
  logoutBtn: {
    padding: Spacing.xs,
    backgroundColor: Palette.dangerLight,
    borderRadius: 8,
  },
  metricsContainer: {
    marginBottom: Spacing.xl,
    marginHorizontal: -Spacing.md, // offset scrollview padding
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    color: Palette.text,
  },
  gridCard: {
    paddingVertical: Spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  actionItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    color: Palette.textMuted,
  },
  appointmentCard: {
    padding: Spacing.md,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    backgroundColor: Palette.primaryLight,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    marginRight: 16,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Palette.primary,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Palette.primary,
  },
  appointmentInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Palette.text,
  },
  doctorSpec: {
    fontSize: 13,
    color: Palette.textMuted,
    marginVertical: 2,
  },
  appointmentTime: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.primary,
  },
});
