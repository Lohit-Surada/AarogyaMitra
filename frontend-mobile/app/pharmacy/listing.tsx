import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getBackendUrl } from '@/utils/api';

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

const SORT_OPTIONS = [
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Ratings', value: 'ratings_desc' },
];

export default function ProductListing() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Route parameters
  const routeCategory = params.category as string || '';
  const routeSearch = params.search as string || '';

  // Local state
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState(routeSearch);
  const [category, setCategory] = useState(routeCategory);
  
  // Sorting & Filtering
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [inStockOnly, setInStockOnly] = useState<boolean | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchProducts = useCallback(async (pageNum: number, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let url = getBackendUrl(
        `/api/pharmacy/products?page=${pageNum}&size=8&sortBy=${sortBy}&sortDir=${sortDir}`
      );

      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (inStockOnly) {
        url += `&inStock=true`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network error');
      }

      const data = await response.json();
      const newProducts = data.content || [];

      if (isInitial) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }

      setHasMore(!data.last && newProducts.length > 0);
    } catch (error) {
      console.error('Error fetching products list:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, search, inStockOnly, sortBy, sortDir]);

  useEffect(() => {
    setPage(0);
    fetchProducts(0, true);
  }, [category, search, inStockOnly, sortBy, sortDir, fetchProducts]);

  const loadMoreProducts = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, false);
    }
  };

  const handleSortChange = (optionValue: string) => {
    const [field, direction] = optionValue.split('_');
    setSortBy(field);
    setSortDir(direction);
    setShowSortDropdown(false);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/pharmacy/${item.id}`)}>
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      {!item.inStock && (
        <View style={styles.outOfStockBadge}>
          <ThemedText style={styles.outOfStockText}>OUT OF STOCK</ThemedText>
        </View>
      )}
      <View style={styles.cardContent}>
        <ThemedText style={styles.categoryBadge}>{item.category}</ThemedText>
        <ThemedText style={styles.nameText} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <ThemedText style={styles.manufacturerText}>{item.manufacturer}</ThemedText>
        
        <View style={styles.cardFooter}>
          <ThemedText style={styles.priceText}>₹{item.price.toFixed(2)}</ThemedText>
          <View style={styles.ratingRow}>
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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>
          {category ? category : 'Pharmacy Shop'}
        </ThemedText>
        <Link href="/pharmacy/cart" asChild>
          <Pressable style={styles.cartBtn}>
            <Ionicons name="cart-outline" size={24} color="#0f172a" />
          </Pressable>
        </Link>
      </View>

      {/* Subheaders (Search & filters) */}
      <View style={styles.filterBar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search within listing..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Action buttons (Sort, Availability Filter) */}
      <View style={styles.actionsBar}>
        <Pressable style={styles.actionBtn} onPress={() => setShowSortDropdown(!showSortDropdown)}>
          <Ionicons name="funnel-outline" size={16} color="#334155" />
          <ThemedText style={styles.actionBtnText}>Sort By</ThemedText>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, inStockOnly && styles.actionBtnActive]}
          onPress={() => setInStockOnly(prev => (prev ? null : true))}>
          <Ionicons name="checkmark-circle-outline" size={16} color={inStockOnly ? '#ffffff' : '#334155'} />
          <ThemedText style={[styles.actionBtnText, inStockOnly && styles.actionBtnTextActive]}>
            In Stock Only
          </ThemedText>
        </Pressable>
      </View>

      {/* Sort Options Dropdown */}
      {showSortDropdown && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map(opt => {
            const isSelected = `${sortBy}_${sortDir}` === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.sortItem, isSelected && styles.sortItemActive]}
                onPress={() => handleSortChange(opt.value)}>
                <ThemedText style={[styles.sortText, isSelected && styles.sortTextActive]}>
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cube-outline" size={60} color="#cbd5e1" />
          <ThemedText style={styles.emptyText}>No products found matching filters</ThemedText>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={renderProductItem}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.3}
          ListFooterComponent={() =>
            loadingMore ? (
              <ActivityIndicator size="small" color="#10b981" style={{ marginVertical: 16 }} />
            ) : null
          }
        />
      )}
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
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cartBtn: {
    padding: 4,
  },
  filterBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#334155',
  },
  actionsBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  actionBtnActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  actionBtnTextActive: {
    color: '#ffffff',
  },
  sortDropdown: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    position: 'absolute',
    top: 155,
    left: 0,
    right: 0,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  sortItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sortItemActive: {
    backgroundColor: '#f1f5f9',
  },
  sortText: {
    fontSize: 14,
    color: '#334155',
  },
  sortTextActive: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  listContainer: {
    padding: 8,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 120,
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
  cardContent: {
    padding: 10,
  },
  categoryBadge: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  manufacturerText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
});
