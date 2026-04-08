import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
}

interface LocalUserState {
  user: UserProfile | null;
  isLoading: boolean;
  loadFromStorage: () => Promise<void>;
  setUser: (user: UserProfile) => Promise<void>;
  clearUser: () => Promise<void>;
}

const DEFAULT_USER: UserProfile = {
  first_name: 'User',
  last_name: '',
  email: 'local@device.app',
};

export const useAuthStore = create<LocalUserState>((set) => ({
  user: null,
  isLoading: true,

  loadFromStorage: async () => {
    try {
      const str = await AsyncStorage.getItem('local_user');
      if (str) {
        set({ user: JSON.parse(str), isLoading: false });
      } else {
        // First launch: auto-create a default local user
        await AsyncStorage.setItem('local_user', JSON.stringify(DEFAULT_USER));
        set({ user: DEFAULT_USER, isLoading: false });
      }
    } catch {
      set({ user: DEFAULT_USER, isLoading: false });
    }
  },

  setUser: async (user) => {
    await AsyncStorage.setItem('local_user', JSON.stringify(user));
    set({ user });
  },

  clearUser: async () => {
    await AsyncStorage.removeItem('local_user');
    set({ user: null });
  },
}));
