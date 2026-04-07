import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { api } from '../services/api';
import { useAuthStore } from '../services/authStore';
import { database } from '../services/database';
import { Q } from '@nozbe/watermelondb';

const C = { 
  bg: '#0f0c29', 
  card: 'rgba(255,255,255,0.06)', 
  border: 'rgba(255,255,255,0.10)', 
  text: '#ffffff', 
  muted: 'rgba(255,255,255,0.55)', 
  purple: '#6C63FF' 
};

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);

  // Check if user has any saved expenses (for offline access)
  useEffect(() => {
    checkForLocalData();
  }, []);

  const checkForLocalData = async () => {
    try {
      const count = await database.collections.get('expenses').query().fetchCount();
      setHasLocalData(count > 0);
    } catch (e) {
      setHasLocalData(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/token/', { 
        email: email.trim(), 
        password 
      });

      await setAuth(res.data.user, res.data.access);
      router.replace('/(tabs)/');
      
    } catch (e: any) {
      console.log("Login error:", e);

      if (e?.message?.toLowerCase().includes('network') || 
          e?.code === 'ERR_NETWORK' || 
          e?.message?.includes('Failed to fetch')) {
        
        if (hasLocalData) {
          Alert.alert(
            'Offline Mode',
            'Cannot connect to server right now.\n\nWould you like to continue with your saved data?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Continue Offline', 
                onPress: () => router.replace('/(tabs)/') 
              }
            ]
          );
        } else {
          Alert.alert(
            'Network Error', 
            'Cannot connect to the server.\nMake sure your backend is running and try again.'
          );
        }
      } else {
        Alert.alert('Login Failed', e?.response?.data?.detail || e?.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinueOffline = () => {
    router.replace('/(tabs)/');
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: C.bg }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} 
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 64, fontWeight: '900', color: C.purple }}>$</Text>
          <Text style={{ fontSize: 30, fontWeight: '800', color: C.text }}>Budget Tracker</Text>
          <Text style={{ fontSize: 16, color: C.muted, marginTop: 4 }}>Manage your money offline</Text>
        </View>

        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 6 }}>EMAIL</Text>
          <TextInput 
            style={styles.input} 
            placeholder="you@example.com" 
            placeholderTextColor={C.muted} 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address" 
            autoCapitalize="none" 
          />

          <Text style={{ fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 6 }}>PASSWORD</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Your password" 
            placeholderTextColor={C.muted} 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
          />

          <TouchableOpacity 
            style={[styles.button, { opacity: loading ? 0.6 : 1 }]} 
            onPress={handleLogin} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Offline Button */}
        {hasLocalData && (
          <TouchableOpacity onPress={handleContinueOffline} style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={{ color: C.purple, fontSize: 15, fontWeight: '700' }}>
              Continue Offline →
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 30 }}>
          <Text style={{ color: C.muted, fontSize: 15 }}>No account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={{ color: C.purple, fontSize: 15, fontWeight: '700' }}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: C.text,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 16,
  },
  button: {
    backgroundColor: C.purple,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
});