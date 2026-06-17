import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Text,
  Animated,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';

type ServiceItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  route: string;
};

const SERVICES: ServiceItem[] = [
  {
    id: 'chatbot',
    title: 'AI Doctor',
    subtitle: 'Ask health questions',
    icon: 'chatbubble-ellipses',
    color: '#0B5A80',
    bgColor: '#E0F2FE',
    route: '/chatbot',
  },
  {
    id: 'diagnosis',
    title: 'AI Diagnosis',
    subtitle: 'Symptom checker',
    icon: 'medical',
    color: '#10B981',
    bgColor: '#D1FAE5',
    route: '/disease-prediction',
  },
  {
    id: 'maps',
    title: 'Nearby Care',
    subtitle: 'Hospitals & clinics',
    icon: 'location',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    route: '/maps',
  },
  {
    id: 'pharmacy',
    title: 'Pharmacy',
    subtitle: 'Order medicines',
    icon: 'storefront',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    route: '/pharmacy',
  },
];

const HEALTH_TIPS = [
  '💧 Drink at least 8 glasses of water daily.',
  '🏃 30 minutes of moderate exercise keeps the doctor away.',
  '🛌 Adults need 7–9 hours of quality sleep per night.',
  '🥗 Eat colourful vegetables — each colour packs different nutrients.',
  '🧘 5 minutes of deep breathing can reduce stress immediately.',
];

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tipIndex] = useState(() => Math.floor(Math.random() * HEALTH_TIPS.length));

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [weather, setWeather] = useState<{
    temp: number;
    description: string;
    icon: string;
    city: string;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchWeather() {
      try {
        setWeatherLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied for weather widget.');
          setWeatherLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) return;

        const { latitude, longitude } = location.coords;
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=0d0bac635fa95fef3443454cda19fad6&units=metric`
        );
        const data = await response.json();

        if (!isMounted) return;

        if (data && data.main && data.weather && data.weather[0]) {
          setWeather({
            temp: data.main.temp,
            description: data.weather[0].main,
            icon: data.weather[0].icon,
            city: data.name,
          });
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        if (isMounted) {
          setWeatherLoading(false);
        }
      }
    }

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  const userInitial = useMemo(() => {
    const src = user?.displayName || user?.email || 'G';
    return src.trim().charAt(0).toUpperCase();
  }, [user?.displayName, user?.email]);

  const firstName = useMemo(() => {
    if (!user) return 'Guest';
    const name = user.displayName || user.email || 'User';
    return name.split(' ')[0].split('@')[0];
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuOpen(false);
    } catch {
      Alert.alert('Logout Failed', 'Please try again.');
    }
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Palette.background} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.logoBadge}>
                <Ionicons name="heart-half" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.appName}>AarogyaMitra</Text>
                <Text style={styles.appTagline}>Health Assistance Platform</Text>
              </View>
            </View>

            {/* Profile / Auth button */}
            <View>
              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={() => setMenuOpen(v => !v)}
                activeOpacity={0.8}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{userInitial}</Text>
                </View>
              </TouchableOpacity>

              {menuOpen && (
                <View style={styles.dropdownMenu}>
                  {user ? (
                    <>
                      <Text style={styles.menuName}>{user.displayName || user.email}</Text>
                      <Text style={styles.menuEmail} numberOfLines={1}>{user.email}</Text>
                      <View style={styles.menuDivider} />
                      <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={16} color={Palette.danger} />
                        <Text style={[styles.menuItemText, { color: Palette.danger }]}>Sign Out</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => { setMenuOpen(false); router.push('/login'); }}
                    >
                      <Ionicons name="log-in-outline" size={16} color={Palette.primary} />
                      <Text style={[styles.menuItemText, { color: Palette.primary }]}>Sign In</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* ── Greeting Banner ── */}
          <View style={styles.greetingBanner}>
            <View style={styles.greetingLeft}>
              <Text style={styles.greetingText}>{greeting},</Text>
              <Text style={styles.greetingName}>{firstName} 👋</Text>
              <Text style={styles.greetingSubtitle}>How are you feeling today?</Text>
            </View>
            
            {weatherLoading ? (
              <View style={styles.weatherContainer}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : weather ? (
              <View style={styles.weatherContainer}>
                <View style={styles.weatherRow}>
                  <Image
                    source={{ uri: `https://openweathermap.org/img/wn/${weather.icon}@2x.png` }}
                    style={styles.weatherIconImage}
                  />
                  <Text style={styles.weatherTemp}>{Math.round(weather.temp)}°C</Text>
                </View>
                <Text style={styles.weatherDesc} numberOfLines={1}>{weather.description}</Text>
                <Text style={styles.weatherCity} numberOfLines={1}>{weather.city}</Text>
              </View>
            ) : (
              <View style={styles.greetingIcon}>
                <Ionicons name="fitness" size={48} color="rgba(255,255,255,0.3)" />
              </View>
            )}
          </View>

          {/* ── Health Tip ── */}
          <View style={styles.tipCard}>
            <View style={styles.tipIconWrap}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipLabel}>Daily Health Tip</Text>
              <Text style={styles.tipText}>{HEALTH_TIPS[tipIndex]}</Text>
            </View>
          </View>

          {/* ── Services Grid ── */}
          <Text style={styles.sectionTitle}>Our Services</Text>
          <View style={styles.servicesGrid}>
            {SERVICES.map((svc) => (
              <Pressable
                key={svc.id}
                style={({ pressed }) => [styles.serviceCard, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                onPress={() => router.push(svc.route as any)}
              >
                <View style={[styles.serviceIconWrap, { backgroundColor: svc.bgColor }]}>
                  <Ionicons name={svc.icon} size={28} color={svc.color} />
                </View>
                <Text style={styles.serviceTitle}>{svc.title}</Text>
                <Text style={styles.serviceSubtitle}>{svc.subtitle}</Text>
              </Pressable>
            ))}
          </View>

          {/* ── Quick Actions ── */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => router.push('/chatbot')}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={Palette.primary} />
              <Text style={styles.quickBtnText}>Ask AI Doctor</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBtn, styles.quickBtnGreen]}
              onPress={() => router.push('/pharmacy')}
              activeOpacity={0.85}
            >
              <Ionicons name="cart-outline" size={20} color="#10B981" />
              <Text style={[styles.quickBtnText, { color: '#10B981' }]}>Buy Medicines</Text>
            </TouchableOpacity>
          </View>

          {/* ── Emergency Banner ── */}
          <View style={styles.emergencyBanner}>
            <Ionicons name="alert-circle" size={22} color={Palette.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyTitle}>Medical Emergency?</Text>
              <Text style={styles.emergencyText}>Dial 112 immediately for ambulance services.</Text>
            </View>
          </View>

          {/* ── Sign In Prompt (for guests) ── */}
          {!loading && !user && (
            <TouchableOpacity
              style={styles.loginPrompt}
              onPress={() => router.push('/login')}
              activeOpacity={0.88}
            >
              <Ionicons name="person-circle-outline" size={20} color="#fff" />
              <Text style={styles.loginPromptText}>Sign In to unlock full features</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}

          <View style={{ height: 32 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },
  scroll: { padding: Spacing.md, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { fontSize: 17, fontWeight: '800', color: Palette.text },
  appTagline: { fontSize: 11, color: Palette.textMuted },
  avatarBtn: { position: 'relative' },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0F2FE',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Dropdown
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: 48,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    minWidth: 200,
    ...Shadows.lg,
    zIndex: 999,
  },
  menuName: { fontSize: 15, fontWeight: '700', color: Palette.text },
  menuEmail: { fontSize: 12, color: Palette.textMuted, marginTop: 2, maxWidth: 180 },
  menuDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: Spacing.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  menuItemText: { fontSize: 14, fontWeight: '600' },

  // Greeting Banner
  greetingBanner: {
    backgroundColor: Palette.primary,
    borderRadius: 20,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  greetingLeft: { flex: 1 },
  greetingText: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  greetingName: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 2 },
  greetingSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  greetingIcon: { marginLeft: 8 },
  weatherContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    minWidth: 80,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherIconImage: {
    width: 28,
    height: 28,
    marginRight: 2,
  },
  weatherTemp: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  weatherDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginTop: 1,
    textAlign: 'center',
  },
  weatherCity: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
    textAlign: 'center',
    maxWidth: 75,
  },

  // Health Tip
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipLabel: { fontSize: 11, fontWeight: '700', color: '#92400E', marginBottom: 3 },
  tipText: { fontSize: 13, color: '#78350F', lineHeight: 19 },

  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },

  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.md,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  serviceIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  serviceTitle: { fontSize: 15, fontWeight: '700', color: Palette.text },
  serviceSubtitle: { fontSize: 12, color: Palette.textMuted, marginTop: 2 },

  // Quick Actions
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: Spacing.md },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.primary,
    backgroundColor: '#E0F2FE',
  },
  quickBtnGreen: { borderColor: '#10B981', backgroundColor: '#D1FAE5' },
  quickBtnText: { fontSize: 13, fontWeight: '700', color: Palette.primary },

  // Emergency
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emergencyTitle: { fontSize: 14, fontWeight: '700', color: '#991B1B' },
  emergencyText: { fontSize: 12, color: '#B91C1C', marginTop: 2 },

  // Login Prompt
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginBottom: Spacing.sm,
  },
  loginPromptText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
