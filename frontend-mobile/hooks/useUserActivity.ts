import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/lib/auth';
import {
  initUserSession,
  updateLastSeen,
  endUserSession,
  logEvent,
} from '@/services/rtdbService';

/**
 * Hook that manages user session lifecycle in Firebase RTDB.
 * - Calls initUserSession on login/foreground
 * - Pings updateLastSeen every 60 seconds while active
 * - Calls endUserSession on background/logout
 *
 * Mount this once at the root layout level.
 */
export function useUserActivity() {
  const { user } = useAuth();
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const stopPing = () => {
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
  };

  const startPing = (email: string) => {
    stopPing();
    pingRef.current = setInterval(() => {
      updateLastSeen(email);
    }, 60_000); // ping every 60 seconds
  };

  // ── Auth change: init or end session ─────────────────────────────────────
  useEffect(() => {
    const email = user?.email;
    if (!email) {
      stopPing();
      return;
    }

    // Initialize session
    initUserSession(email, user.displayName).then(() => {
      logEvent('login', email);
    });
    startPing(email);

    return () => {
      stopPing();
      if (email) endUserSession(email);
    };
  }, [user?.email]);

  // ── AppState change: foreground/background ────────────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        const email = user?.email;
        const prev = appStateRef.current;
        appStateRef.current = nextState;

        if (!email) return;

        if (nextState === 'active' && prev !== 'active') {
          // App came to foreground
          initUserSession(email, user?.displayName);
          startPing(email);
          logEvent('page_view', email, { screen: 'foreground' });
        } else if (nextState === 'background' && prev === 'active') {
          // App went to background
          stopPing();
          updateLastSeen(email);
          endUserSession(email);
        }
      }
    );

    return () => subscription.remove();
  }, [user?.email]);
}
