import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticatedFetch, getBackendUrl } from '../utils/api';
import { auth } from '../lib/firebase';

const GUEST_CART_KEY = 'GUEST_CART';

export type GuestProduct = {
  id: number;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
  stock: number;
};

export type CartItem = {
  id?: number;
  product: GuestProduct;
  quantity: number;
};

export async function getCart(): Promise<CartItem[]> {
  const user = auth.currentUser;
  if (user) {
    try {
      const res = await authenticatedFetch('/api/pharmacy/cart');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch authenticated cart', e);
    }
    return [];
  } else {
    // Guest Cart - stored locally on device
    const guestCartStr = await AsyncStorage.getItem(GUEST_CART_KEY);
    return guestCartStr ? JSON.parse(guestCartStr) : [];
  }
}

export async function addToCart(productId: number, quantity: number, productDetails: GuestProduct): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    try {
      await authenticatedFetch('/api/pharmacy/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
    } catch (e) {
      console.error('Failed to add to authenticated cart', e);
    }
  } else {
    // Guest Cart — saves full product details locally on device
    const cart = await getCart();
    const existingIndex = cart.findIndex(item => item.product.id === productId);
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({ product: productDetails, quantity });
    }
    await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  }
}

export async function updateCartQuantity(productId: number, quantity: number): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    try {
      await authenticatedFetch('/api/pharmacy/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
    } catch (e) {
      console.error('Failed to update authenticated cart', e);
    }
  } else {
    const cart = await getCart();
    const existingIndex = cart.findIndex(item => item.product.id === productId);
    if (existingIndex >= 0) {
      cart[existingIndex].quantity = quantity;
      await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    }
  }
}

export async function removeFromCart(productId: number): Promise<void> {
  const user = auth.currentUser;
  if (user) {
    try {
      await authenticatedFetch(`/api/pharmacy/cart/remove?productId=${productId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Failed to remove from authenticated cart', e);
    }
  } else {
    const cart = await getCart();
    const filteredCart = cart.filter(item => item.product.id !== productId);
    await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(filteredCart));
  }
}

export async function mergeGuestCartWithBackend(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const guestCartStr = await AsyncStorage.getItem(GUEST_CART_KEY);
  if (guestCartStr) {
    const guestCart: CartItem[] = JSON.parse(guestCartStr);
    if (guestCart.length > 0) {
      // Send each to backend
      for (const item of guestCart) {
        try {
          await authenticatedFetch('/api/pharmacy/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: item.product.id, quantity: item.quantity }),
          });
        } catch (e) {
          console.error('Failed to merge cart item', e);
        }
      }
      // Clear local guest cart
      await AsyncStorage.removeItem(GUEST_CART_KEY);
    }
  }
}
