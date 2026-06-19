import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getBackendUrl } from '@/utils/api';
import { Palette, Spacing, Radius, Shadows, HEADER_PADDING_TOP } from '@/constants/theme';
import { realtimeDb } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

const CATEGORIES = [
  { id: 'Medicines', name: 'Medicines', icon: 'medical' as const, color: '#10B981', bg: '#D1FAE5' },
  { id: 'Health Supplements', name: 'Supplements', icon: 'leaf' as const, color: '#3B82F6', bg: '#DBEAFE' },
  { id: 'Personal Care', name: 'Personal Care', icon: 'color-palette' as const, color: '#EC4899', bg: '#FCE7F3' },
  { id: 'Medical Devices', name: 'Devices', icon: 'pulse' as const, color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'Baby Care', name: 'Baby Care', icon: 'heart' as const, color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'Fitness', name: 'Fitness', icon: 'barbell' as const, color: '#EF4444', bg: '#FEE2E2' },
];

const OFFERS = [
  { id: '1', title: 'Flat 10% Off', subtitle: 'On your first medicine order', code: 'HEALTH10', color: '#0B5A80' },
  { id: '2', title: 'Free Delivery', subtitle: 'On supplements above ₹500', code: 'SUPP500', color: '#10B981' },
  { id: '3', title: 'Save 50%', subtitle: 'New user special offer', code: 'WELCOME50', color: '#8B5CF6' },
];

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  ratings: number;
  manufacturer: string;
  inStock: boolean;
};

// ─── Skeleton card for loading placeholder ────────────────────────────────────
function SkeletonCard({ shimmer }: { shimmer: Animated.Value }) {
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return (
    <Animated.View style={[styles.productCard, { opacity }]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, { width: '60%', height: 8 }]} />
        <View style={[styles.skeletonLine, { width: '90%', height: 12 }]} />
        <View style={[styles.skeletonLine, { width: '40%', height: 10, marginTop: 8 }]} />
      </View>
    </Animated.View>
  );
}

function ProductCard({ item, onPress }: { item: Product; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.productCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
      onPress={onPress}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      {!item.inStock && (
        <View style={styles.outOfStockBadge}>
          <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
        </View>
      )}
      {item.ratings >= 4.5 && item.inStock && (
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>⭐ Top Rated</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productCategory} numberOfLines={1}>{item.category}</Text>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productMfr} numberOfLines={1}>{item.manufacturer}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{item.price.toFixed(0)}</Text>
          <View style={styles.ratingChip}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.ratings}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function PharmacyHome() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendWaking, setBackendWaking] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Shimmer loop for skeleton cards
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    fetchHomeData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      // Wake-up ping with a short timeout to detect cold start
      const wakeTimer = setTimeout(() => setBackendWaking(true), 3000);

      const [featRes, recRes] = await Promise.all([
        fetch(getBackendUrl('/api/pharmacy/products/featured')),
        fetch(getBackendUrl('/api/pharmacy/products/recommended')),
      ]);

      clearTimeout(wakeTimer);
      setBackendWaking(false);

      if (featRes.ok) setFeatured((await featRes.json()).slice(0, 8));
      if (recRes.ok) setRecommended((await recRes.json()).slice(0, 8));
    } catch (error) {
      console.error('Error fetching pharmacy home data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time listener for live stock updates
  useEffect(() => {
    const productsRef = ref(realtimeDb, 'realtime/products');
    
    const handleData = (snapshot: any) => {
      const val = snapshot.val();
      if (val) {
        setFeatured(prev => prev.map(p => {
          if (val[p.id] && val[p.id].stock !== undefined) {
            const newStock = val[p.id].stock;
            return { ...p, stock: newStock, inStock: newStock > 0 };
          }
          return p;
        }));
        
        setRecommended(prev => prev.map(p => {
          if (val[p.id] && val[p.id].stock !== undefined) {
            const newStock = val[p.id].stock;
            return { ...p, stock: newStock, inStock: newStock > 0 };
          }
          return p;
        }));
      }
    };

    onValue(productsRef, handleData);
    return () => off(productsRef, 'value', handleData);
  }, []);

  const handleSearchSubmit = () => {
    if (search.trim()) {
      router.push({ pathname: '/pharmacy/listing', params: { search: search.trim() } });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="storefront" size={18} color="#fff" />
          <View>
            <Text style={styles.headerTitle}>Aarogya Pharmacy</Text>
            <Text style={styles.headerSub}>Verified Healthcare Products</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Link href="/pharmacy/cart" asChild>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="cart-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </Link>
          <Link href="/pharmacy/orders" asChild>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="receipt-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={styles.searchCard}>
          <Ionicons name="search-outline" size={18} color={Palette.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicines, supplements..."
            placeholderTextColor={Palette.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Palette.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Backend cold-start notice */}
        {backendWaking && (
          <View style={styles.wakingBanner}>
            <ActivityIndicator size="small" color={Palette.primary} />
            <Text style={styles.wakingText}>Server is starting up, please wait a moment...</Text>
          </View>
        )}

        {/* Offers */}
        <Text style={styles.sectionTitle}>Offers & Deals</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersList}
        >
          {OFFERS.map(offer => (
            <View key={offer.id} style={[styles.offerCard, { backgroundColor: offer.color }]}>
              <View style={styles.offerTop}>
                <Ionicons name="pricetag" size={18} color="rgba(255,255,255,0.7)" />
                <Text style={styles.offerTitle}>{offer.title}</Text>
              </View>
              <Text style={styles.offerSub}>{offer.subtitle}</Text>
              <View style={styles.offerCodeRow}>
                <Text style={styles.offerCodeLabel}>Use code: </Text>
                <Text style={styles.offerCode}>{offer.code}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat.id}
              style={({ pressed }) => [styles.categoryItem, pressed && { opacity: 0.8 }]}
              onPress={() => router.push({ pathname: '/pharmacy/listing', params: { category: cat.id } })}
            >
              <View style={[styles.catIconWrap, { backgroundColor: cat.bg }]}>
                <Ionicons name={cat.icon} size={26} color={cat.color} />
              </View>
              <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
            </Pressable>
          ))}
        </View>

        {/* Products */}
        {loading ? (
          <>
            {/* Skeleton placeholder rows */}
            <Text style={styles.sectionTitle}>⭐ Top Rated</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {[1, 2, 3].map(k => <SkeletonCard key={k} shimmer={shimmerAnim} />)}
            </ScrollView>
            <Text style={styles.sectionTitle}>🔥 Popular</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
              {[1, 2, 3].map(k => <SkeletonCard key={k} shimmer={shimmerAnim} />)}
            </ScrollView>
          </>
        ) : (
          <>
            {featured.length > 0 && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>⭐ Top Rated</Text>
                  <TouchableOpacity onPress={() => router.push('/pharmacy/listing')}>
                    <Text style={styles.viewAll}>View All</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={featured}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <ProductCard item={item} onPress={() => router.push(`/pharmacy/${item.id}`)} />
                  )}
                  contentContainerStyle={styles.hList}
                />
              </View>
            )}

            {recommended.length > 0 && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🔥 Popular</Text>
                  <TouchableOpacity onPress={() => router.push('/pharmacy/listing')}>
                    <Text style={styles.viewAll}>View All</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={recommended}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <ProductCard item={item} onPress={() => router.push(`/pharmacy/${item.id}`)} />
                  )}
                  contentContainerStyle={styles.hList}
                />
              </View>
            )}

            {featured.length === 0 && recommended.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="storefront-outline" size={56} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No products available</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchHomeData}>
                  <Text style={styles.retryTxt}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={{ height: 80 }} />
      </Animated.ScrollView>

      {/* Floating Cart */}
      <Link href="/pharmacy/cart" asChild>
        <TouchableOpacity style={styles.floatingCart} activeOpacity={0.85}>
          <Ionicons name="cart" size={24} color="#fff" />
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary,
    paddingHorizontal: Spacing.md,
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollBody: { paddingBottom: 100 },

  // Backend waking banner
  wakingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  wakingText: { fontSize: 12, color: '#1E40AF', fontWeight: '600', flex: 1 },

  // Search
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 10,
    ...Shadows.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: Palette.text },

  // Sections
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  viewAll: { fontSize: 13, fontWeight: '700', color: Palette.secondary },

  // Offers
  offersList: { paddingHorizontal: Spacing.md, gap: 12 },
  offerCard: {
    width: 220,
    borderRadius: 18,
    padding: Spacing.md,
    gap: 6,
  },
  offerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  offerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  offerCodeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  offerCodeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  offerCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },

  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  categoryItem: { width: '30%', alignItems: 'center', marginBottom: 8 },
  catIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catName: { fontSize: 12, fontWeight: '600', color: Palette.text, textAlign: 'center' },

  // Product Cards
  hList: { paddingLeft: Spacing.md, paddingRight: Spacing.sm },
  productCard: {
    width: 155,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.sm,
  },
  productImage: { width: '100%', height: 110, resizeMode: 'cover' },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Palette.danger,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  outOfStockText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  topBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  topBadgeText: { color: '#92400E', fontSize: 8, fontWeight: '700' },
  productInfo: { padding: 10 },
  productCategory: { fontSize: 9, color: Palette.textMuted, textTransform: 'uppercase', fontWeight: '700' },
  productName: { fontSize: 13, fontWeight: '700', color: Palette.text, marginTop: 2, lineHeight: 18 },
  productMfr: { fontSize: 11, color: Palette.textMuted, marginTop: 1 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: { fontSize: 14, fontWeight: '800', color: Palette.secondary },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#92400E' },

  // Skeleton placeholders
  skeletonImage: { width: '100%', height: 110, backgroundColor: '#E2E8F0' },
  skeletonBody: { padding: 10, gap: 6 },
  skeletonLine: { backgroundColor: '#E2E8F0', borderRadius: 4 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, color: Palette.textMuted, marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: Palette.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.md },
  retryTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Floating Cart
  floatingCart: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Palette.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
});
