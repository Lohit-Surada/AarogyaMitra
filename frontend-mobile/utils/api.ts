import Constants from 'expo-constants';

/**
 * Resolves the backend API URL dynamically based on the current Expo Host IP address
 * or falls back to a default localhost/standard IP address.
 * @param path Endpoint sub-path (e.g. '/api/pharmacy/products')
 */
export function getBackendUrl(path: string): string {
  return `https://aarogyamitra-4.onrender.com${path}`;
}

