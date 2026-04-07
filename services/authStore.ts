import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from './api';

interface AuthState {
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: async (user, token) => {
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(user));
    setAuthToken(token);
    set({ user, token, isAuthenticated: true });
  },
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    setAuthToken(null);
    set({ user: null, token: null, isAuthenticated: false });
  },
  loadFromStorage: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('auth_user');
      if (token && userStr) {
        setAuthToken(token);
        set({ user: JSON.parse(userStr), token, isAuthenticated: true });
      }
    } catch (e) {}
    finally { set({ isLoading: false }); }
  },
}));
