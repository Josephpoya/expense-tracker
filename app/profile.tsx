import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  Alert, StatusBar, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../services/authStore';
import { api } from '../services/api';

const C = { bg:'#0f0c29',card:'rgba(255,255,255,0.06)',border:'rgba(255,255,255,0.10)',text:'#ffffff',muted:'rgba(255,255,255,0.55)',purple:'#6C63FF',green:'#4ade80',red:'#f87171' };

export default function ProfileScreen() {
  const { user, setUser } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName]   = useState(user?.last_name  || '');
  const [email, setEmail]         = useState(user?.email      || '');
  const [phone, setPhone]         = useState(user?.phone_number || '');
  const [saving, setSaving]       = useState(false);

  const initials = ((firstName?.[0] || '') + (lastName?.[0] || '') || email?.[0] || 'U').toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/users/profile/', {
        first_name: firstName,
        last_name: lastName,
        phone_number: phone || null,
      });
      setUser?.({ ...user, ...res.data });
      Alert.alert('✅ Saved', 'Your profile has been updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Error', JSON.stringify(e?.response?.data || 'Failed to update profile'));
    } finally { setSaving(false); }
  };

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <StatusBar barStyle="light-content"/>
      <SafeAreaView style={{ flex:1 }}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{ flex:1 }}>

          {/* Header */}
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingVertical:12, borderBottomWidth:1, borderBottomColor:C.border }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color:C.muted, fontSize:15 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color:C.text, fontSize:17, fontWeight:'700' }}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={C.purple} size="small"/> : <Text style={{ color:C.purple, fontSize:15, fontWeight:'700' }}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding:20 }} keyboardShouldPersistTaps="handled">

            {/* Avatar */}
            <View style={{ alignItems:'center', marginBottom:28 }}>
              <View style={{ width:80, height:80, borderRadius:40, backgroundColor:C.purple+'44', justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:C.purple }}>
                <Text style={{ color:C.purple, fontWeight:'800', fontSize:30 }}>{initials}</Text>
              </View>
              <Text style={{ color:C.muted, fontSize:12, marginTop:8 }}>Tap Save to update your details</Text>
            </View>

            {/* Fields */}
            {[
              { label:'First Name', value:firstName, setter:setFirstName, placeholder:'John', keyboard:'default' },
              { label:'Last Name',  value:lastName,  setter:setLastName,  placeholder:'Doe',  keyboard:'default' },
              { label:'Phone Number', value:phone, setter:setPhone, placeholder:'+256 700 000000', keyboard:'phone-pad' },
            ].map(field => (
              <View key={field.label} style={{ marginBottom:16 }}>
                <Text style={{ color:C.muted, fontSize:12, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>{field.label}</Text>
                <TextInput
                  style={{ backgroundColor:C.card, borderRadius:14, paddingHorizontal:16, paddingVertical:13, fontSize:15, color:C.text, borderWidth:1, borderColor:C.border }}
                  placeholder={field.placeholder}
                  placeholderTextColor={C.muted}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType={field.keyboard as any}
                />
              </View>
            ))}

            {/* Email (read-only) */}
            <View style={{ marginBottom:16 }}>
              <Text style={{ color:C.muted, fontSize:12, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>Email</Text>
              <View style={{ backgroundColor:'rgba(255,255,255,0.03)', borderRadius:14, paddingHorizontal:16, paddingVertical:13, borderWidth:1, borderColor:C.border }}>
                <Text style={{ color:C.muted, fontSize:15 }}>{email}</Text>
              </View>
              <Text style={{ color:C.muted, fontSize:11, marginTop:4 }}>Email cannot be changed</Text>
            </View>

            {/* Change Password Link */}
            <TouchableOpacity
              style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:C.card, borderRadius:14, padding:16, borderWidth:1, borderColor:C.border, marginTop:8 }}
              onPress={() => router.push('/change-password')}
            >
              <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                <Text style={{ fontSize:20 }}>🔒</Text>
                <Text style={{ color:C.text, fontSize:15, fontWeight:'600' }}>Change Password</Text>
              </View>
              <Text style={{ color:C.muted, fontSize:20 }}>›</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
