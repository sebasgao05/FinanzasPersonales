import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { BASE_MONTHS, BASE_CURRENCIES } from '@/lib/utils/constants';
import { resolveWithFallback } from '@/lib/utils/settings-fallback';

/**
 * User application settings (currency, year, month defaults).
 * Validates: Requirements 16.1, 16.2, 16.3, 16.4
 */
export interface AppSettings {
  defaultCurrency: string;
  defaultYear: number;
  defaultMonth: string;
}

export interface SettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

// --- Mock data layer ---
// Simulates Amplify Data client for AppSetting entity.
// Stores settings per user in memory (resets on page reload).
const settingsStore: Record<string, AppSettings> = {};

async function loadSettings(userId: string): Promise<AppSettings | null> {
  // Simulate async API call
  await new Promise((resolve) => setTimeout(resolve, 100));
  return settingsStore[userId] ?? null;
}

async function saveSettings(userId: string, settings: AppSettings): Promise<AppSettings> {
  // Simulate async API call
  await new Promise((resolve) => setTimeout(resolve, 100));
  settingsStore[userId] = { ...settings };
  return settingsStore[userId];
}
// --- End mock data layer ---

// resolveWithFallback is now imported from @/lib/utils/settings-fallback

/**
 * Resolves year with fallback.
 * Since years are dynamic, we just validate it's a reasonable number.
 * If the year is somehow invalid, defaults to the current year.
 */
function resolveYearWithFallback(
  configuredYear: number,
  _activeYears?: readonly number[]
): number {
  if (Number.isFinite(configuredYear) && configuredYear > 0) {
    return configuredYear;
  }
  return new Date().getFullYear();
}

/** Builds default settings for first-time login (Req 16.1) */
function buildInitialSettings(): AppSettings {
  const now = new Date();
  const currentMonthIndex = now.getMonth(); // 0-based
  return {
    defaultCurrency: 'COP',
    defaultYear: now.getFullYear(),
    defaultMonth: BASE_MONTHS[currentMonthIndex],
  };
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { isAuthenticated, user } = useAuth();

  const [settings, setSettings] = useState<AppSettings>(buildInitialSettings());
  const [isLoading, setIsLoading] = useState(true);

  // Load or create settings when authenticated user changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const userId = user.userId;

    async function initSettings() {
      setIsLoading(true);
      try {
        let loaded = await loadSettings(userId);

        if (!loaded) {
          // First login: create default settings (Req 16.1)
          const defaults = buildInitialSettings();
          loaded = await saveSettings(userId, defaults);
        }

        if (cancelled) return;

        // Apply fallback resolution (Req 16.4)
        const resolved: AppSettings = {
          defaultCurrency: resolveWithFallback(loaded.defaultCurrency, BASE_CURRENCIES),
          defaultYear: resolveYearWithFallback(loaded.defaultYear),
          defaultMonth: resolveWithFallback(loaded.defaultMonth, BASE_MONTHS),
        };

        setSettings(resolved);
      } catch {
        // On error, keep initial defaults
        setSettings(buildInitialSettings());
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    initSettings();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  // Update settings: persist and apply (Req 16.3)
  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      if (!user) return;

      const userId = user.userId;
      const merged: AppSettings = { ...settings, ...updates };

      // Apply fallback on save too
      const resolved: AppSettings = {
        defaultCurrency: resolveWithFallback(merged.defaultCurrency, BASE_CURRENCIES),
        defaultYear: resolveYearWithFallback(merged.defaultYear),
        defaultMonth: resolveWithFallback(merged.defaultMonth, BASE_MONTHS),
      };

      await saveSettings(userId, resolved);
      setSettings(resolved);
    },
    [settings, user]
  );

  const value: SettingsContextValue = {
    settings,
    isLoading,
    updateSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export { SettingsContext };
