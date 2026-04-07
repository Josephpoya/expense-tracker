import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { api } from '../services/api';

const C = { bg: '#0f0c29', card: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.10)', text: '#ffffff', muted: 'rgba(255,255,255,0.55)', purple: '#6C63FF' };

export default function RegisterScreen() {
  const [form, setForm] = useState({ email: '', username: '', first_name: '', last_name: '', password: '', password_confirm: '' });
  const [loading, setLoading] = useState(false);
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.username) { Alert.alert('Error', 'Fill required fields.'); return; }
    if (form.password !== form.password_confirm) { Alert.alert('Error', 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/users/register/', form);
      Alert.alert('Success', 'Account created! Sign in.', [{ text: 'OK', onPress: () => router.replace('/login') }]);
    } catch (e: any) {
      const d = e?.response?.data;
      Alert.alert('Error', typeof d === 'object' ? Object.values(d).flat().join('\n') : 'Failed.');
    } finally { setLoading(false); }
  };

  const fields = [
    { k: 'first_name', l: 'First Name', p: 'John' },
    { k: 'last_name', l: 'Last Name', p: 'Doe' },
    { k: 'username', l: 'Username *', p: 'johndoe' },
    { k: 'email', l: 'Email *', p: 'you@example.com', kb: 'email-address' },
    { k: 'password', l: 'Password *', p: 'Min 8 chars', s: true },
    { k: 'password_confirm', l: 'Confirm Password *', p: 'Repeat', s: true },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: C.text }}>Create Account</Text>
          <Text style={{ fontSize: 15, color: C.muted, marginTop: 4 }}>Start tracking your expenses</Text>
        </View>
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: C.border }}>
          {fields.map(f => (
            <View key={f.k}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 5 }}>{f.l.toUpperCase()}</Text>
              <TextInput style={{ borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 14 }} placeholder={f.p} placeholderTextColor={C.muted} value={(form as any)[f.k]} onChangeText={v => update(f.k, v)} secureTextEntry={f.s} keyboardType={(f as any).kb || 'default'} autoCapitalize="none" />
            </View>
          ))}
          <TouchableOpacity style={{ backgroundColor: C.purple, borderRadius: 14, paddingVertical: 15, alignItems: 'center', opacity: loading ? 0.6 : 1 }} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Create Account</Text>}
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: C.muted, fontSize: 15 }}>Have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/login')}><Text style={{ color: C.purple, fontSize: 15, fontWeight: '700' }}>Sign In</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
