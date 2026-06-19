import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getBackendUrl } from '@/utils/api';
import { Palette, Spacing, Radius, Shadows, HEADER_PADDING_TOP } from '@/constants/theme';

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  ratings: number;
  manufacturer: string;

};

const SORT_OPTIONS = [
  { label: 'Price: Low → High', value: 'price_asc' },
  { label: 'Price: High → Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'ratings_desc' },
];

function ProductCard({ item, onPress }: { item: Product; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      onPress={onPress}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      {item.stock <= 0 && (
        <View style={styles.outBadge}>
          <Text style={styles.outBadgeText}>OUT OF STOCK</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardCat} numberOfLines={1}>{item.category}</Text>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.cardMfr} numberOfLines={1}>{item.manufacturer}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>₹{item.price.toFixed(0)}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.ratings}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function ProductListing() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const routeCategory = (params.category as string) || '';
  const routeSearch = (params.search as string) || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState(routeSearch);
  const [category] = useState(routeCategory);
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [showSort, setShowSort] = useState(false);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchProducts = useCallback(
    async (pageNum: number, isInitial = false) => {
      try {
        isInitial ? setLoading(true) : setLoadingMore(true);
        let url = getBackendUrl(
          `/api/pharmacy/products?page=${pageNum}&size=8&sortBy=${sortBy}&sortDir=${sortDir}`
        );
        if (category) url += `&category=${encodeURIComponent(category)}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;


        const response = await fetch(url);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        const newProducts: Product[] = data.content || [];

        isInitial
          ? setProducts(newProducts)
          : setProducts(prev => [...prev, ...newProducts]);
        setHasMore(!data.last && newProducts.length > 0);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, search, sortBy, sortDir]
  );

  useEffect(() => {
    setPage(0);
    fetchProducts(0, true);
  }, [fetchProducts]);

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const next = page + 1;
      setPage(next);
      fetchProducts(next, false);
    }
  };

  const handleSort = (val: string) => {
    const [field, dir] = val.split('_');
    setSortBy(field);
    setSortDir(dir);
    setShowSort(false);
  };

  const activeSort = SORT_OPTIONS.find(o => o.value === `${sortBy}_${sortDir}`)?.label || 'Sort By';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={Palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {category || 'All Products'}
        </Text>
        <Link href="/pharmacy/cart" asChild>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="cart-outline" size={22} color={Palette.text} />
          </TouchableOpacity>
        </Link>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={Palette.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search within results..."
          placeholderTextColor={Palette.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Palette.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setShowSort(v => !v)}
        >
          <Ionicons name="funnel-outline" size={14} color={Palette.primary} />
          <Text style={styles.filterChipText}>{activeSort}</Text>
          <Ionicons name="chevron-down" size={12} color={Palette.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown */}
      {showSort && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map(opt => {
            const isActive = `${sortBy}_${sortDir}` === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sortItem, isActive && styles.sortItemActive]}
                onPress={() => handleSort(opt.value)}
              >
                {isActive && <Ionicons name="checkmark" size={14} color={Palette.secondary} />}
                <Text style={[styles.sortText, isActive && styles.sortTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Palette.secondary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your filters or search term</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() => router.push(`/pharmacy/${item.id}`)}
            />
          )}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={Palette.secondary}
                style={{ marginVertical: 20 }}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },

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
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Palette.text, flex: 1, textAlign: 'center' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: Spacing.md,
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: Palette.text },

  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: 10,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.round,
    borderWidth: 1.5,
    borderColor: Palette.primary,
    backgroundColor: '#E0F2FE',
  },
  filterChipActive: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  filterChipText: { fontSize: 12, fontWeight: '700', color: Palette.primary },
  filterChipTextActive: { color: '#fff' },

  sortDropdown: {
    backgroundColor: '#fff',
    marginHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    marginBottom: 8,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sortItemActive: { backgroundColor: '#F0FDF4' },
  sortText: { fontSize: 14, color: Palette.text },
  sortTextActive: { color: Palette.secondary, fontWeight: '700' },

  listContainer: { padding: Spacing.sm, paddingBottom: 40 },
  row: { justifyContent: 'space-between' },

  card: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.sm,
  },
  cardImage: { width: '100%', height: 120, resizeMode: 'cover' },
  outBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Palette.danger,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  outBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  cardBody: { padding: 10 },
  cardCat: {
    fontSize: 9,
    color: Palette.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardName: { fontSize: 13, fontWeight: '700', color: Palette.text, marginTop: 2, lineHeight: 18 },
  cardMfr: { fontSize: 11, color: Palette.textMuted, marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardPrice: { fontSize: 14, fontWeight: '800', color: Palette.secondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#92400E' },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 40,
  },
  loadingText: { fontSize: 14, color: Palette.textMuted, marginTop: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Palette.text },
  emptySubtitle: { fontSize: 13, color: Palette.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
