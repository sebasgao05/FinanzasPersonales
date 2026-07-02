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
import { client } from '@/lib/amplify-client';

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

function resolveYearWithFallback(configuredYear: number): number {
  if (Number.isFinite(configuredYear) && configuredYear > 0) {
    return configuredYear;
  }
  return new Date().getFullYear();
}

/** Builds default settings for first-time login (Req 16.1) */
function buildInitialSettings(): AppSettings {
  const now = new Date();
  const currentMonthIndex = now.getMonth();
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
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load or create settings when authenticated user changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function initSettings() {
      setIsLoading(true);
      try {
        const { data: items } = await client.models.AppSetting.list();

        if (cancelled) return;

        if (items && items.length > 0) {
          const item = items[0];
          setSettingsId(item.id);
          const resolved: AppSettings = {
            defaultCurrency: resolveWithFallback(item.defaultCurrency, BASE_CURRENCIES),
            defaultYear: resolveYearWithFallback(item.defaultYear),
            defaultMonth: resolveWithFallback(item.defaultMonth, BASE_MONTHS),
          };
          setSettings(resolved);
        } else {
          // First login: create default settings
          const defaults = buildInitialSettings();
          const { data: created } = await client.models.AppSetting.create({
            defaultCurrency: defaults.defaultCurrency,
            defaultYear: defaults.defaultYear,
            defaultMonth: defaults.defaultMonth,
          });
          if (cancelled) return;
          if (created) {
            setSettingsId(created.id);
          }
          setSettings(defaults);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
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
      if (!settingsId) return;

      const merged: AppSettings = { ...settings, ...updates };
      const resolved: AppSettings = {
        defaultCurrency: resolveWithFallback(merged.defaultCurrency, BASE_CURRENCIES),
        defaultYear: resolveYearWithFallback(merged.defaultYear),
        defaultMonth: resolveWithFallback(merged.defaultMonth, BASE_MONTHS),
      };

      await client.models.AppSetting.update({
        id: settingsId,
        defaultCurrency: resolved.defaultCurrency,
        defaultYear: resolved.defaultYear,
        defaultMonth: resolved.defaultMonth,
      });

      setSettings(resolved);
    },
    [settings, settingsId]
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
