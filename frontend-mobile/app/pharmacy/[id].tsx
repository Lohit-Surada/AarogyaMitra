import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth';
import { getBackendUrl } from '@/utils/api';

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  ratings: number;
  reviewCount: number;
  description: string;
  uses: string;
  sideEffects: string;
  manufacturer: string;
  stock: number;
  inStock: boolean;
};

export default function ProductDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const userEmail = user?.email || 'guest@aarogyamitra.com';

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'uses' | 'sides'>('desc');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [prescriptionUploaded, setPrescriptionUploaded] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(getBackendUrl(`/api/pharmacy/products/${id}`));
      if (!response.ok) {
        throw new Error('Product not found');
      }
      const data = await response.json();
      setProduct(data);

      // Fetch similar products
      const simRes = await fetch(
        getBackendUrl(`/api/pharmacy/products?category=${encodeURIComponent(data.category)}&size=4`)
      );
      if (simRes.ok) {
        const simData = await simRes.json();
        setSimilar((simData.content || []).filter((p: Product) => p.id !== data.id));
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      Alert.alert('Error', 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (checkoutImmediately = false) => {
    if (!product) return;
    if (!product.inStock) {
      Alert.alert('Out of Stock', 'This product is currently unavailable.');
      return;
    }
    if (product.category === 'Medicines' && !prescriptionUploaded) {
      Alert.alert(
        'Prescription Required',
        'Please upload your prescription before purchasing prescription medicines.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Mock Upload', onPress: () => {
            setPrescriptionUploaded(true);
            Alert.alert('Success', 'Prescription validated successfully.');
          }}
        ]
      );
      return;
    }

    try {
      setAddingToCart(true);
      const response = await fetch(getBackendUrl('/api/pharmacy/cart/add'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          productId: product.id,
          quantity: quantity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      if (checkoutImmediately) {
        router.push('/pharmacy/cart');
      } else {
        Alert.alert('Added to Cart', `${quantity}x ${product.name} added successfully!`, [
          { text: 'View Cart', onPress: () => router.push('/pharmacy/cart') },
          { text: 'Continue Shopping' },
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not add product to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  const uploadPrescriptionMock = () => {
    setPrescriptionUploaded(true);
    Alert.alert('Prescription Verified', 'Mock doctor prescription successfully uploaded and verified.');
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorWrap}>
        <ThemedText>Product details not found.</ThemedText>
        <Pressable style={styles.backBtnText} onPress={() => router.back()}>
          <ThemedText style={{ color: '#10b981', fontWeight: 'bold' }}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>Product Details</ThemedText>
        <Pressable onPress={() => setIsWishlisted(!isWishlisted)} style={styles.headerBtn}>
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={24}
            color={isWishlisted ? '#ef4444' : '#0f172a'}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Image Display */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.imageUrl }} style={styles.mainImage} />
        </View>

        {/* Main Info */}
        <View style={styles.infoSection}>
          <View style={styles.badgeRow}>
            <View style={[styles.categoryBadge, { backgroundColor: '#10b98115' }]}>
              <ThemedText style={styles.categoryText}>{product.category}</ThemedText>
            </View>
            <View style={[styles.stockBadge, { backgroundColor: product.inStock ? '#22c55e15' : '#ef444415' }]}>
              <ThemedText style={[styles.stockText, { color: product.inStock ? '#22c55e' : '#ef4444' }]}>
                {product.inStock ? `In Stock (${product.stock} left)` : 'Out of Stock'}
              </ThemedText>
            </View>
          </View>

          <ThemedText style={styles.productName}>{product.name}</ThemedText>
          <ThemedText style={styles.manufacturer}>Mfg: {product.manufacturer}</ThemedText>

          <View style={styles.priceRatingRow}>
            <ThemedText style={styles.price}>₹{product.price.toFixed(2)}</ThemedText>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <ThemedText style={styles.ratingValue}>{product.ratings}</ThemedText>
              <ThemedText style={styles.reviewCount}>({product.reviewCount} reviews)</ThemedText>
            </View>
          </View>
        </View>

        {/* Prescription Section (Only for medicines) */}
        {product.category === 'Medicines' && (
          <View style={styles.prescriptionCard}>
            <View style={styles.prescriptionHeader}>
              <Ionicons name="document-text-outline" size={24} color="#059669" />
              <View>
                <ThemedText style={styles.prescTitle}>Prescription Required</ThemedText>
                <ThemedText style={styles.prescSubtitle}>A valid doctor prescription is required</ThemedText>
              </View>
            </View>
            <Pressable
              style={[styles.prescUploadBtn, prescriptionUploaded && styles.prescUploadBtnUploaded]}
              onPress={uploadPrescriptionMock}>
              <Ionicons
                name={prescriptionUploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
                size={20}
                color={prescriptionUploaded ? '#ffffff' : '#059669'}
              />
              <ThemedText style={[styles.prescUploadBtnText, prescriptionUploaded && styles.prescUploadBtnTextUploaded]}>
                {prescriptionUploaded ? 'Prescription Uploaded' : 'Upload Prescription'}
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* Tabs for description / uses / side effects */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === 'desc' && styles.activeTab]}
            onPress={() => setActiveTab('desc')}>
            <ThemedText style={[styles.tabText, activeTab === 'desc' && styles.activeTabText]}>Description</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'uses' && styles.activeTab]}
            onPress={() => setActiveTab('uses')}>
            <ThemedText style={[styles.tabText, activeTab === 'uses' && styles.activeTabText]}>Uses</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'sides' && styles.activeTab]}
            onPress={() => setActiveTab('sides')}>
            <ThemedText style={[styles.tabText, activeTab === 'sides' && styles.activeTabText]}>Side Effects</ThemedText>
          </Pressable>
        </View>

        <View style={styles.tabContentContainer}>
          {activeTab === 'desc' && <ThemedText style={styles.bodyText}>{product.description}</ThemedText>}
          {activeTab === 'uses' && (
            <View>
              <ThemedText style={styles.bodyTextHeader}>Prescribed for:</ThemedText>
              <ThemedText style={styles.bodyText}>{product.uses}</ThemedText>
            </View>
          )}
          {activeTab === 'sides' && (
            <View>
              <ThemedText style={styles.bodyTextHeader}>Potential side effects:</ThemedText>
              <ThemedText style={styles.bodyText}>{product.sideEffects}</ThemedText>
            </View>
          )}
        </View>

        {/* Similar Products */}
        {similar.length > 0 && (
          <View style={styles.similarSection}>
            <ThemedText style={styles.similarTitle}>Similar Products</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarList}>
              {similar.map(item => (
                <Pressable
                  key={item.id}
                  style={styles.similarCard}
                  onPress={() => router.push(`/pharmacy/${item.id}`)}>
                  <Image source={{ uri: item.imageUrl }} style={styles.similarCardImg} />
                  <ThemedText style={styles.similarCardName} numberOfLines={1}>
                    {item.name}
                  </ThemedText>
                  <ThemedText style={styles.similarCardPrice}>₹{item.price.toFixed(2)}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Footer Quantity Selector and Actions */}
      <View style={styles.footer}>
        <View style={styles.quantitySelector}>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => setQuantity(q => Math.max(1, q - 1))}>
            <Ionicons name="remove" size={18} color="#0f172a" />
          </Pressable>
          <ThemedText style={styles.qtyText}>{quantity}</ThemedText>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => setQuantity(q => Math.min(product.stock, q + 1))}>
            <Ionicons name="add" size={18} color="#0f172a" />
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.btn, styles.btnOutline]}
            onPress={() => handleAddToCart(false)}
            disabled={addingToCart}>
            <ThemedText style={styles.btnOutlineText}>Add to Cart</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => handleAddToCart(true)}
            disabled={addingToCart}>
            {addingToCart ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.btnPrimaryText}>Buy Now</ThemedText>
            )}
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    maxWidth: '70%',
  },
  scrollContent: {
    paddingBottom: 130,
  },
  imageContainer: {
    backgroundColor: '#f8fafc',
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    width: '80%',
    height: '90%',
    resizeMode: 'contain',
  },
  infoSection: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#10b981',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  manufacturer: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  priceRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  reviewCount: {
    fontSize: 12,
    color: '#64748b',
  },
  prescriptionCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    gap: 12,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prescTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#065f46',
  },
  prescSubtitle: {
    fontSize: 12,
    color: '#047857',
  },
  prescUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 8,
  },
  prescUploadBtnUploaded: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  prescUploadBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#059669',
  },
  prescUploadBtnTextUploaded: {
    color: '#ffffff',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    marginHorizontal: 16,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: '#10b981',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
  },
  activeTabText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  tabContentContainer: {
    padding: 16,
  },
  bodyTextHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  similarSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  similarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  similarList: {
    gap: 12,
  },
  similarCard: {
    width: 120,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  similarCardImg: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  similarCardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 6,
    textAlign: 'center',
  },
  similarCardPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 2,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  backBtnText: {
    marginTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    gap: 14,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    marginLeft: 12,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: '#10b981',
    backgroundColor: '#ffffff',
  },
  btnOutlineText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  btnPrimary: {
    backgroundColor: '#10b981',
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
