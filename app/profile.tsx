import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StatusBar, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../services/authStore';

const C = { bg: '#0f0c29', card: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.10)', text: '#ffffff', muted: 'rgba(255,255,255,0.55)', purple: '#6C63FF' };

export default function ProfileScreen() {
  const { user, setUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [saving, setSaving] = useState(false);

  const initials = ((firstName?.[0] || '') + (lastName?.[0] || '') || 'U').toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    try {
      await setUser({ ...user!, first_name: firstName, last_name: lastName, phone_number: phone });
      Alert.alert('✅ Saved', 'Profile updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile.');
    } finally { setSaving(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: C.muted, fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: C.text, fontSize: 17, fontWeight: '700' }}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={C.purple} size="small" /> : <Text style={{ color: C.purple, fontSize: 15, fontWeight: '700' }}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.purple + '44', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.purple }}>
                <Text style={{ color: C.purple, fontWeight: '800', fontSize: 30 }}>{initials}</Text>
              </View>
              <Text style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>Stored locally on this device</Text>
            </View>

            {[
              { label: 'First Name', value: firstName, setter: setFirstName, placeholder: 'John' },
              { label: 'Last Name', value: lastName, setter: setLastName, placeholder: 'Doe' },
              { label: 'Phone Number', value: phone, setter: setPhone, placeholder: '+256 700 000000' },
            ].map(field => (
              <View key={field.label} style={{ marginBottom: 16 }}>
                <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{field.label}</Text>
                <TextInput
                  style={{ backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border }}
                  placeholder={field.placeholder}
                  placeholderTextColor={C.muted}
                  value={field.value}
                  onChangeText={field.setter}
                />
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
