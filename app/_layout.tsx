import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../services/authStore';
import { View, ActivityIndicator } from 'react-native';

// ✅ ADD THESE
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadFromStorage } = useAuthStore();

  useEffect(() => { loadFromStorage(); }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) { router.replace('/(tabs)/'); }
      else { router.replace('/login'); }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <ThemeProvider>
        <LanguageProvider>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0c29' }}>
            <ActivityIndicator size="large" color="#6C63FF" />
          </View>
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add-transaction" />
          <Stack.Screen name="currency-converter" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="change-password" />
        </Stack>
      </LanguageProvider>
    </ThemeProvider>
  );
}