import { AppState, AppStateStatus } from 'react-native';

type NetworkStatusListener = (isOnline: boolean) => void;

let listeners: NetworkStatusListener[] = [];
let currentOnlineState = true;
let isChecking = false;

/**
 * Checks connectivity by probing the Supabase REST endpoint with a short timeout.
 */
export const checkIsOnline = async (supabaseUrl?: string): Promise<boolean> => {
  if (isChecking) return currentOnlineState;
  isChecking = true;

  try {
    const url = supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!url) {
      isChecking = false;
      return true;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    // Any HTTP status (including 200, 401, 404, etc.) means internet/server is reachable
    const online = response.status > 0;
    notifyListeners(online);
    isChecking = false;
    return online;
  } catch (error) {
    notifyListeners(false);
    isChecking = false;
    return false;
  }
};

const notifyListeners = (online: boolean) => {
  if (currentOnlineState !== online) {
    currentOnlineState = online;
    listeners.forEach((listener) => listener(online));
  }
};

export const subscribeToNetworkStatus = (listener: NetworkStatusListener) => {
  listeners.push(listener);
  // Send current known status immediately
  listener(currentOnlineState);

  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

// Check connection when app comes to foreground or periodically when offline
AppState.addEventListener('change', (state: AppStateStatus) => {
  if (state === 'active') {
    checkIsOnline();
  }
});

// Periodic check every 8 seconds if offline or every 30 seconds if online
setInterval(() => {
  checkIsOnline();
}, 8000);
