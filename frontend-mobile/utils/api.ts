import Constants from 'expo-constants';

/**
 * Resolves the backend API URL dynamically based on the current Expo Host IP address
 * or falls back to a default localhost/standard IP address.
 * @param path Endpoint sub-path (e.g. '/api/pharmacy/products')
 */
export function getBackendUrl(path: string): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8016${path}`;
  }
  // Default fallback
  return `http://192.168.1.5:8016${path}`;
}
