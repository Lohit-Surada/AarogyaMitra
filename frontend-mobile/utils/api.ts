import Constants from 'expo-constants';
import { auth } from '../lib/firebase';

import { Platform } from 'react-native';

export function getBackendUrl(path: string): string {
  // Updated to the backend deployment with Razorpay keys configured
  return `https://aarogyamitra-15.onrender.com${path}`;
}

export async function authenticatedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = getBackendUrl(path);
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const token = await user.getIdToken();
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  return fetch(url, { ...options, headers });
}
