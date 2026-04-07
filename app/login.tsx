import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { api } from '../services/api';
import { useAuthStore } from '../services/authStore';

const C = { bg: '#0f0c29', card: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.10)', text: '#ffffff', muted: 'rgba(255,255,255,0.55)', purple: '#6C63FF' };

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Enter email and password.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/token/', { email: email.trim(), password });
      await setAuth(res.data.user, res.data.access);
      router.replace('/(tabs)/');
    } catch (e: any) {
      Alert.alert('Login Failed', e?.response?.data?.error || e?.response?.data?.detail || e?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 64, fontWeight: '900', color: C.purple }}>$</Text>
          <Text style={{ fontSize: 30, fontWeight: '800', color: C.text }}>Expense Tracker</Text>
          <Text style={{ fontSize: 16, color: C.muted, marginTop: 4 }}>Sign in to your account</Text>
        </View>
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 6 }}>EMAIL</Text>
          <TextInput style={{ borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: C.text, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 16 }} placeholder="you@example.com" placeholderTextColor={C.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 6 }}>PASSWORD</Text>
          <TextInput style={{ borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: C.text, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 16 }} placeholder="Your password" placeholderTextColor={C.muted} value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={{ backgroundColor: C.purple, borderRadius: 14, paddingVertical: 15, alignItems: 'center', opacity: loading ? 0.6 : 1 }} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Sign In</Text>}
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: C.muted, fontSize: 15 }}>No account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}><Text style={{ color: C.purple, fontSize: 15, fontWeight: '700' }}>Sign Up</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
