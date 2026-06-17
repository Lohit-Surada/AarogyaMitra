import { useEffect, useState } from 'react';
import { subscribeToAppConfig, AppConfig } from '@/services/rtdbService';

/**
 * Hook for subscribing to live app configuration from Firebase RTDB.
 * Allows remote control of: maintenance mode, announcements, feature flags.
 *
 * Usage:
 *   const { config } = useAppConfig();
 *   if (config.maintenanceMode) return <MaintenanceScreen />;
 */
export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>({
    maintenanceMode: false,
    announcement: '',
    minAppVersion: '1.0.0',
    supportEmail: 'support@aarogyamitra.com',
    pharmacyEnabled: true,
    chatbotEnabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAppConfig((newConfig) => {
      setConfig(newConfig);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { config, loading };
}
