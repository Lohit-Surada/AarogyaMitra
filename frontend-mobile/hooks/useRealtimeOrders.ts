import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { subscribeToOrders } from '@/services/rtdbService';

type LiveOrder = {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
};

type UseRealtimeOrdersResult = {
  orders: LiveOrder[];
  loading: boolean;
  latestOrder: LiveOrder | null;
};

/**
 * Hook for subscribing to live order status updates from Firebase RTDB.
 * Any order status change from the backend or admin is reflected instantly.
 *
 * Usage:
 *   const { orders, latestOrder } = useRealtimeOrders();
 */
export function useRealtimeOrders(): UseRealtimeOrdersResult {
  const { user } = useAuth();
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = user?.email;
    if (!email) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToOrders(email, (list) => {
      setOrders(list as LiveOrder[]);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.email]);

  return {
    orders,
    loading,
    latestOrder: orders.length > 0 ? orders[0] : null,
  };
}
