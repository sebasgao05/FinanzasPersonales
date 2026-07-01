import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { getCurrentUser, signOut as amplifySignOut, type AuthUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const checkUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // Listen for auth events: signIn, signOut, session expiry (Req 1.7, 1.8)
  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          checkUser();
          break;
        case 'signedOut':
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          break;
        case 'tokenRefresh_failure':
          // Session expired - clear state (Req 1.7)
          // Redirect to login is handled by ProtectedRoute
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          break;
      }
    });

    return unsubscribe;
  }, [checkUser]);

  // Sign out: end session and clear state (Req 1.8)
  const handleSignOut = useCallback(async () => {
    try {
      await amplifySignOut();
    } catch {
      // Force clear state even if signOut API call fails
    } finally {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const value: AuthContextValue = {
    ...authState,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
