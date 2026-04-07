import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  Alert, StatusBar, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { api } from '../services/api';

const C = { bg:'#0f0c29',card:'rgba(255,255,255,0.06)',border:'rgba(255,255,255,0.10)',text:'#ffffff',muted:'rgba(255,255,255,0.55)',purple:'#6C63FF',green:'#4ade80',red:'#f87171' };

export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword]   = useState('');
  const [newPassword, setNewPassword]   = useState('');
  const [confirmPass, setConfirmPass]   = useState('');
  const [showOld, setShowOld]           = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConf, setShowConf]         = useState(false);
  const [saving, setSaving]             = useState(false);

  const strength = newPassword.length === 0 ? null
    : newPassword.length < 6 ? 'weak'
    : newPassword.length < 10 ? 'fair'
    : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'strong' : 'fair';

  const strengthColor = strength === 'strong' ? '#4ade80' : strength === 'fair' ? '#fbbf24' : '#f87171';

  const handleSave = async () => {
    if (!oldPassword) { Alert.alert('Error', 'Enter your current password.'); return; }
    if (newPassword.length < 6) { Alert.alert('Error', 'New password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPass) { Alert.alert('Error', 'Passwords do not match.'); return; }
    setSaving(true);
    try {
      await api.post('/users/change-password/', { old_password: oldPassword, new_password: newPassword });
      Alert.alert('✅ Password Changed', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      const err = e?.response?.data;
      const msg = typeof err === 'object' ? Object.values(err).flat().join('\n') : 'Failed to change password.';
      Alert.alert('Error', msg);
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
            <Text style={{ color:C.text, fontSize:17, fontWeight:'700' }}>Change Password</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={C.purple} size="small"/> : <Text style={{ color:C.purple, fontSize:15, fontWeight:'700' }}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding:20 }} keyboardShouldPersistTaps="handled">

            <View style={{ alignItems:'center', marginBottom:28 }}>
              <Text style={{ fontSize:48, marginBottom:8 }}>🔒</Text>
              <Text style={{ color:C.muted, fontSize:13, textAlign:'center' }}>Choose a strong password with at least 8 characters, a number and an uppercase letter.</Text>
            </View>

            {/* Current Password */}
            <Text style={{ color:C.muted, fontSize:12, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>Current Password</Text>
            <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:14, paddingHorizontal:16, borderWidth:1, borderColor:C.border, marginBottom:20 }}>
              <TextInput
                style={{ flex:1, color:C.text, paddingVertical:13, fontSize:15 }}
                placeholder="Enter current password"
                placeholderTextColor={C.muted}
                secureTextEntry={!showOld}
                value={oldPassword}
                onChangeText={setOldPassword}
              />
              <TouchableOpacity onPress={() => setShowOld(v => !v)}>
                <Text style={{ fontSize:18 }}>{showOld ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <Text style={{ color:C.muted, fontSize:12, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>New Password</Text>
            <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:14, paddingHorizontal:16, borderWidth:1, borderColor:C.border, marginBottom:8 }}>
              <TextInput
                style={{ flex:1, color:C.text, paddingVertical:13, fontSize:15 }}
                placeholder="Enter new password"
                placeholderTextColor={C.muted}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNew(v => !v)}>
                <Text style={{ fontSize:18 }}>{showNew ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Strength indicator */}
            {strength && (
              <View style={{ marginBottom:16 }}>
                <View style={{ flexDirection:'row', gap:4, marginBottom:4 }}>
                  {['weak','fair','strong'].map((s, i) => (
                    <View key={s} style={{ flex:1, height:4, borderRadius:2, backgroundColor: ['weak','fair','strong'].indexOf(strength) >= i ? strengthColor : 'rgba(255,255,255,0.1)' }}/>
                  ))}
                </View>
                <Text style={{ color:strengthColor, fontSize:12, fontWeight:'600', textTransform:'capitalize' }}>{strength} password</Text>
              </View>
            )}

            {/* Confirm Password */}
            <Text style={{ color:C.muted, fontSize:12, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>Confirm New Password</Text>
            <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:14, paddingHorizontal:16, borderWidth:1, borderColor: confirmPass && confirmPass !== newPassword ? C.red : C.border, marginBottom:24 }}>
              <TextInput
                style={{ flex:1, color:C.text, paddingVertical:13, fontSize:15 }}
                placeholder="Repeat new password"
                placeholderTextColor={C.muted}
                secureTextEntry={!showConf}
                value={confirmPass}
                onChangeText={setConfirmPass}
              />
              <TouchableOpacity onPress={() => setShowConf(v => !v)}>
                <Text style={{ fontSize:18 }}>{showConf ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {confirmPass && confirmPass !== newPassword && (
              <Text style={{ color:C.red, fontSize:12, marginTop:-18, marginBottom:16 }}>Passwords do not match</Text>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={{ borderRadius:16, paddingVertical:17, alignItems:'center', backgroundColor:C.purple, opacity: saving ? 0.7 : 1 }}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff"/> : <Text style={{ color:'#fff', fontSize:17, fontWeight:'800' }}>Update Password</Text>}
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
