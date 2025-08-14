// src/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const initializeAuthListener = () => {
      try {
        unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            if (mounted) {
              setUser(user);
              setLoading(false);
              setError(null);
            }
          },
          (error) => {
            console.error('Auth state change error:', error);
            if (mounted) {
              setError(error.message);
              setLoading(false);
            }
          }
        );
      } catch (error) {
        console.error('Failed to initialize auth listener:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize authentication');
          setLoading(false);
        }
      }
    };

    initializeAuthListener();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) { // ⬅️ FIX: Specify 'any' type for error
      console.error('Login error:', error);
      let userMessage = 'Failed to login. Please check your credentials.';
      if (error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        userMessage = 'Invalid credentials. Please try again.';
      }
      setError(userMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      setUser({ ...userCredential.user, displayName: name });
    } catch (error: any) { // ⬅️ FIX: Specify 'any' type for error
      console.error('Registration error:', error);
      let userMessage = 'Failed to register.';
      if (error.code === 'auth/email-already-in-use') {
        userMessage = 'This email address is already in use.';
      } else if (error.code === 'auth/weak-password') {
        userMessage = 'Password must be at least 6 characters long.';
      }
      setError(userMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signOut(auth);
    } catch (error: any) { // ⬅️ FIX: Specify 'any' type for error
      console.error('Logout error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};