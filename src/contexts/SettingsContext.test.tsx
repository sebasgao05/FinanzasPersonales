import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { SettingsProvider, useSettings } from './SettingsContext';
import { AuthContext } from './AuthContext';
import type { AuthUser } from 'aws-amplify/auth';

// Helper to create a wrapper with AuthContext mocked
function createWrapper(authValue: {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider value={authValue}>
        <SettingsProvider>{children}</SettingsProvider>
      </AuthContext.Provider>
    );
  };
}

const mockUser: AuthUser = {
  userId: 'test-user-123',
  username: 'testuser',
};

const authenticatedContext = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  signOut: vi.fn(),
};

const unauthenticatedContext = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  signOut: vi.fn(),
};

describe('SettingsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial default settings when user is authenticated (first login)', async () => {
    const wrapper = createWrapper(authenticatedContext);
    const { result } = renderHook(() => useSettings(), { wrapper });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Req 16.1: defaults are COP, current year, current month
    const now = new Date();
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    expect(result.current.settings.defaultCurrency).toBe('COP');
    expect(result.current.settings.defaultYear).toBe(now.getFullYear());
    expect(result.current.settings.defaultMonth).toBe(months[now.getMonth()]);
  });

  it('does not crash when user is not authenticated', async () => {
    const wrapper = createWrapper(unauthenticatedContext);
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should still have defaults
    expect(result.current.settings.defaultCurrency).toBe('COP');
  });

  it('persists settings updates (Req 16.3)', async () => {
    const wrapper = createWrapper(authenticatedContext);
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateSettings({ defaultCurrency: 'USD' });
    });

    expect(result.current.settings.defaultCurrency).toBe('USD');
  });

  it('applies fallback when currency is not in active catalogs (Req 16.4)', async () => {
    const wrapper = createWrapper(authenticatedContext);
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Try to set a currency that doesn't exist in BASE_CURRENCIES
    await act(async () => {
      await result.current.updateSettings({ defaultCurrency: 'GBP' });
    });

    // Fallback to first active currency: 'COP'
    expect(result.current.settings.defaultCurrency).toBe('COP');
  });

  it('applies fallback when month is not in active catalogs (Req 16.4)', async () => {
    const wrapper = createWrapper(authenticatedContext);
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Try to set an invalid month
    await act(async () => {
      await result.current.updateSettings({ defaultMonth: 'InvalidMonth' });
    });

    // Fallback to first month: 'Enero'
    expect(result.current.settings.defaultMonth).toBe('Enero');
  });

  it('allows updating year (Req 16.3)', async () => {
    const wrapper = createWrapper(authenticatedContext);
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateSettings({ defaultYear: 2023 });
    });

    expect(result.current.settings.defaultYear).toBe(2023);
  });

  it('throws error when useSettings is used outside provider', () => {
    expect(() => {
      renderHook(() => useSettings());
    }).toThrow('useSettings must be used within a SettingsProvider');
  });

  it('allows partial updates without losing other settings', async () => {
    // Use a different user to avoid shared state from other tests
    const freshUser: AuthUser = { userId: 'fresh-user-partial', username: 'fresh' };
    const wrapper = createWrapper({
      ...authenticatedContext,
      user: freshUser,
    });
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Update only currency
    await act(async () => {
      await result.current.updateSettings({ defaultCurrency: 'EUR' });
    });

    // Year and month should remain at their initial defaults
    const now = new Date();
    expect(result.current.settings.defaultCurrency).toBe('EUR');
    expect(result.current.settings.defaultYear).toBe(now.getFullYear());
  });
});
