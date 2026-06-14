import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getBackendUrl } from '@/utils/api';

const CATEGORIES = [
  { id: 'Medicines', name: 'Medicines', icon: 'medical' as const, color: '#10b981' },
  { id: 'Health Supplements', name: 'Supplements', icon: 'leaf' as const, color: '#3b82f6' },
  { id: 'Personal Care', name: 'sparkles' as const, icon: 'color-palette' as const, color: '#ec4899' },
  { id: 'Medical Devices', name: 'Devices', icon: 'pulse' as const, color: '#f59e0b' },
  { id: 'Baby Care', name: 'Baby Care', icon: 'heart' as const, color: '#8b5cf6' },
  { id: 'Fitness', name: 'Fitness', icon: 'barbell' as const, color: '#ef4444' },
];

const OFFERS = [
  {
    id: '1',
    title: 'Flat 10% Off',
    subtitle: 'On your first medicine order',
    code: 'HEALTH10',
    color: '#047857',
  },
  {
    id: '2',
    title: 'Free Delivery',
    subtitle: 'On health supplements above ₹500',
    code: 'SUPP500',
    color: '#1d4ed8',
  },
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

export default function PharmacyHome() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [featRes, recRes] = await Promise.all([
        fetch(getBackendUrl('/api/pharmacy/products/featured')),
        fetch(getBackendUrl('/api/pharmacy/products/recommended')),
      ]);

      if (featRes.ok) {
        const featData = await featRes.json();
        setFeatured(featData.slice(0, 6));
      }
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommended(recData.slice(0, 6));
      }
    } catch (error) {
      console.error('Error fetching pharmacy home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    if (search.trim()) {
      router.push({
        pathname: '/pharmacy/listing',
        params: { search: search.trim() },
      });
    }
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <Pressable
      style={styles.productCard}
      onPress={() => router.push(`/pharmacy/${item.id}`)}>
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      {!item.inStock && (
        <View style={styles.outOfStockBadge}>
          <ThemedText style={styles.outOfStockText}>OUT OF STOCK</ThemedText>
        </View>
      )}
      <View style={styles.productInfo}>
        <ThemedText style={styles.productCategory}>{item.category}</ThemedText>
        <ThemedText numberOfLines={1} style={styles.productName}>
          {item.name}
        </ThemedText>
        <ThemedText style={styles.productManufacturer}>{item.manufacturer}</ThemedText>
        <View style={styles.priceRow}>
          <ThemedText style={styles.productPrice}>₹{item.price.toFixed(2)}</ThemedText>
          <View style={styles.ratingWrap}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            <ThemedText style={styles.ratingText}>{item.ratings}</ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
          <View>
            <ThemedText style={styles.headerTitle}>Aarogya Pharmacy</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Verified Healthcare Products</ThemedText>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Link href="/pharmacy/cart" asChild>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="cart-outline" size={24} color="#ffffff" />
            </Pressable>
          </Link>
          <Link href="/pharmacy/profile" asChild>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="person-outline" size={24} color="#ffffff" />
            </Pressable>
          </Link>
          <Link href="/pharmacy/orders" asChild>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="receipt-outline" size={24} color="#ffffff" />
            </Pressable>
          </Link>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicines, supplements..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          ) : null}
        </View>

        {/* Offers Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersContainer}>
          {OFFERS.map(offer => (
            <View key={offer.id} style={[styles.offerCard, { backgroundColor: offer.color }]}>
              <View>
                <ThemedText style={styles.offerTitle}>{offer.title}</ThemedText>
                <ThemedText style={styles.offerSub}>{offer.subtitle}</ThemedText>
              </View>
              <View style={styles.couponBadge}>
                <ThemedText style={styles.couponText}>Code: {offer.code}</ThemedText>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Categories Grid */}
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Categories
          </ThemedText>
        </View>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat.id}
              style={styles.categoryItem}
              onPress={() =>
                router.push({
                  pathname: '/pharmacy/listing',
                  params: { category: cat.id },
                })
              }>
              <View style={[styles.categoryIconWrap, { backgroundColor: cat.color + '15' }]}>
                <Ionicons name={cat.icon} size={28} color={cat.color} />
              </View>
              <ThemedText style={styles.categoryName} numberOfLines={1}>
                {cat.name}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Loading Indicator */}
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* Featured Products */}
            {featured.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Top Rated
                  </ThemedText>
                  <Pressable onPress={() => router.push('/pharmacy/listing')}>
                    <ThemedText style={styles.viewAllText}>View All</ThemedText>
                  </Pressable>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={featured}
                  keyExtractor={item => item.id.toString()}
                  renderItem={renderProductCard}
                  contentContainerStyle={styles.productList}
                />
              </View>
            )}

            {/* Recommended Products */}
            {recommended.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Popular Products
                  </ThemedText>
                  <Pressable onPress={() => router.push('/pharmacy/listing')}>
                    <ThemedText style={styles.viewAllText}>View All</ThemedText>
                  </Pressable>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={recommended}
                  keyExtractor={item => item.id.toString()}
                  renderItem={renderProductCard}
                  contentContainerStyle={styles.productList}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating cart button */}
      <Link href="/pharmacy/cart" asChild>
        <Pressable style={styles.floatingCart}>
          <Ionicons name="cart" size={28} color="#ffffff" />
        </Pressable>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 16,
  },
  offersContainer: {
    paddingLeft: 16,
    paddingBottom: 8,
    gap: 12,
  },
  offerCard: {
    width: 280,
    height: 110,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    marginRight: 16,
  },
  offerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  offerSub: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  couponBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  couponText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    justifyContent: 'space-around',
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  productList: {
    paddingLeft: 16,
    paddingBottom: 8,
  },
  productCard: {
    width: 160,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 110,
    resizeMode: 'cover',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outOfStockText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 10,
  },
  productCategory: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  productManufacturer: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  floatingCart: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#10b981',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
