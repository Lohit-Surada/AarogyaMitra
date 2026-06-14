import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

type CardProps = {
  title: string;
  buttonLabel: string;
  onPress: () => void;
};

function FeatureCard({ title, buttonLabel, onPress }: CardProps) {
  return (
    <View style={styles.card}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        {title}
      </ThemedText>
      <Pressable style={styles.cardButton} onPress={onPress}>
        <ThemedText style={styles.cardButtonText}>{buttonLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

export default function Index() {
  const { user, loading } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const userInitial = useMemo(() => {
    const source = user?.displayName || user?.email || 'U';
    return source.trim().charAt(0).toUpperCase();
  }, [user?.displayName, user?.email]);

  const handleLoginPress = () => {
    router.push('/login');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setDropdownVisible(false);
      Alert.alert('Logged out', 'You have been signed out successfully.');
    } catch {
      Alert.alert('Logout failed', 'Please try again.');
    }
  };

  return (
    <ThemedView style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.navbar}>
          <View style={styles.navLeft}>
            <View style={styles.logoBadge}>
              <ThemedText style={styles.logoBadgeText}>AM</ThemedText>
            </View>
            <View style={styles.brandBlock}>
              <ThemedText type="title" style={styles.brandName}>
                AarogyaMitra
              </ThemedText>
              <ThemedText style={styles.brandTagline}>Health assistance platform</ThemedText>
            </View>
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search diseases, pharmacy, maps..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />
          </View>

          <View style={styles.navLinks}>
            <Pressable onPress={() => Alert.alert('About', 'AarogyaMitra helps users explore health support features.') }>
              <ThemedText style={styles.navLink}>About</ThemedText>
            </Pressable>
            <Pressable onPress={() => Alert.alert('Contact', 'Contact support from your app support channel.') }>
              <ThemedText style={styles.navLink}>Contact</ThemedText>
            </Pressable>
          </View>

          <View style={styles.profileArea}>
            <Pressable
              style={styles.profileButton}
              onPress={() => setDropdownVisible(previous => !previous)}>
              <View style={styles.avatarCircle}>
                <ThemedText style={styles.avatarText}>{userInitial}</ThemedText>
              </View>
              <View>
                <ThemedText style={styles.profileName}>
                  {loading ? 'Loading...' : user?.displayName || user?.email || 'Guest'}
                </ThemedText>
                <ThemedText style={styles.profileRole}>
                  {user ? 'Logged in user' : 'Guest user'}
                </ThemedText>
              </View>
            </Pressable>

            {dropdownVisible ? (
              <View style={styles.dropdown}>
                <ThemedText style={styles.dropdownLabel}>Profile details</ThemedText>
                <ThemedText style={styles.dropdownValue}>{user?.displayName || 'No display name'}</ThemedText>
                <ThemedText style={styles.dropdownValue}>{user?.email || 'No email'}</ThemedText>
                {user ? (
                  <Pressable style={styles.dropdownAction} onPress={handleLogout}>
                    <ThemedText style={styles.dropdownActionText}>Logout</ThemedText>
                  </Pressable>
                ) : (
                  <Pressable style={styles.dropdownAction} onPress={handleLoginPress}>
                    <ThemedText style={styles.dropdownActionText}>Login</ThemedText>
                  </Pressable>
                )}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.hero}>
          <ThemedText type="title" style={styles.heroTitle}>
            Your health assistance hub in one place.
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Find guidance, explore services, and move from symptoms to support faster.
          </ThemedText>
        </View>

        <View style={styles.cardGrid}>
          <FeatureCard
            title="AI Chatbot"
            buttonLabel="Ask Anything"
            onPress={() => router.push('/chatbot')}
          />
          <FeatureCard
            title="Disease Prediction"
            buttonLabel="Predict"
            onPress={() => router.push('/disease-prediction')}
          />
          <FeatureCard
            title="Maps"
            buttonLabel="Search location"
            onPress={() => router.push('/maps')}
          />
          <FeatureCard
            title="Pharmacy"
            buttonLabel="Visit"
            onPress={() => router.push('/pharmacy')}
          />
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>End of application</ThemedText>
        </View>
      </ScrollView>

      {!user ? (
        <Pressable style={styles.floatingLogin} onPress={handleLoginPress}>
          <ThemedText style={styles.floatingLoginText}>Login</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 24,
  },
  navbar: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: '#052e16',
    fontWeight: '800',
  },
  brandBlock: {
    flexShrink: 1,
  },
  brandName: {
    color: '#fff',
    marginBottom: 2,
  },
  brandTagline: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  searchWrap: {
    width: '100%',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#0f172a',
    fontSize: 15,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 18,
    flexWrap: 'wrap',
  },
  navLink: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
  profileArea: {
    alignSelf: 'flex-end',
    position: 'relative',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1e293b',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#082f49',
    fontWeight: '800',
  },
  profileName: {
    color: '#fff',
    fontWeight: '700',
  },
  profileRole: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  dropdown: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    minWidth: 220,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  dropdownLabel: {
    color: '#0f172a',
    fontWeight: '700',
  },
  dropdownValue: {
    color: '#334155',
  },
  dropdownAction: {
    marginTop: 6,
    backgroundColor: '#111827',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  dropdownActionText: {
    color: '#fff',
    fontWeight: '700',
  },
  hero: {
    gap: 10,
  },
  heroTitle: {
    color: '#0f172a',
  },
  heroSubtitle: {
    color: '#475569',
    lineHeight: 22,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
    minHeight: 150,
  },
  cardTitle: {
    color: '#0f172a',
  },
  cardButton: {
    marginTop: 'auto',
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  footer: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  footerText: {
    color: '#64748b',
    fontWeight: '600',
  },
  floatingLogin: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  floatingLoginText: {
    color: '#fff',
    fontWeight: '700',
  },
});
