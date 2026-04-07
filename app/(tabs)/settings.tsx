import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StatusBar, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../services/authStore';
import { getCurrencies, getWallets, api } from '../../services/api';
import { router } from 'expo-router';
import { Modal, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { useTheme, ThemeCode } from '../../contexts/ThemeContext';
import { useLanguage, LangCode } from '../../contexts/LanguageContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api/v1';

const LANGUAGES: { code: LangCode; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French',  flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'ar', name: 'Arabic',  flag: '🇸🇦' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
];

const THEMES: { code: ThemeCode; name: string; emoji: string; desc: string }[] = [
  { code: 'dark',   name: 'Dark',           emoji: '🌙', desc: 'Easy on the eyes at night' },
  { code: 'light',  name: 'Light',          emoji: '☀️', desc: 'Bright and clean' },
  { code: 'system', name: 'System Default', emoji: '⚙️', desc: 'Follows your device setting' },
];

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { colors: C, themeCode, setThemeCode, isDark } = useTheme();
  const { langCode, setLangCode, t } = useLanguage();

  const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '') || user?.email?.[0] || 'U').toUpperCase();
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'User';

  const [currencies, setCurrencies] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [currentCurrency, setCurrentCurrency] = useState('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  useEffect(() => { loadWalletAndCurrencies(); }, []);

  const loadWalletAndCurrencies = async () => {
    try {
      const [wRes, cRes] = await Promise.all([getWallets(), getCurrencies()]);
      const ws = wRes.data.results || wRes.data;
      const cs = cRes.data.results || cRes.data;
      if (Array.isArray(ws) && ws.length > 0) {
        setWallet(ws[0]);
        setCurrentCurrency(ws[0].base_currency || 'USD');
      }
      if (Array.isArray(cs)) setCurrencies(cs);
    } catch (e) { console.log('Settings load error:', e); }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    if (value) {
      Alert.alert(
        'Development Build Required',
        'Push notifications are not available in Expo Go. Please use a development build to enable budget alerts.\n\nRun: eas build --profile development --platform android',
        [{ text: 'OK' }]
      );
      setNotificationsEnabled(false);
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleCurrencySelect = async (currency: any) => {
    if (!wallet) return;
    setSaving(true);
    try {
      await api.patch(`/wallets/${wallet.id}/`, { base_currency: currency.code });
      setCurrentCurrency(currency.code);
      setWallet((prev: any) => ({ ...prev, base_currency: currency.code }));
      setShowCurrencyPicker(false);
      setSearch('');
      Alert.alert('✅ Updated', `${t('currencyUpdated')} ${currency.code} - ${currency.name}`);
    } catch (e) {
      Alert.alert('Error', 'Could not update currency. Please try again.');
    } finally { setSaving(false); }
  };

  const handleLanguageSelect = (lang: typeof LANGUAGES[0]) => {
    setLangCode(lang.code);       // ← wired into global context + AsyncStorage
    setShowLanguagePicker(false);
    Alert.alert('✅', `${t('languageUpdated')} ${lang.name}`);
  };

  const handleThemeSelect = (theme: typeof THEMES[0]) => {
    setThemeCode(theme.code);     // ← wired into global context + AsyncStorage
    setShowThemePicker(false);
    Alert.alert('✅', `${t('themeUpdated')} ${theme.name}`);
  };

  const handleLogout = () => Alert.alert(t('logout'), t('logoutConfirm'), [
    { text: t('cancel'), style: 'cancel' },
    { text: t('logout'), style: 'destructive', onPress: async () => { await logout(); } },
  ]);

  const filtered = currencies.filter(c =>
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLang = LANGUAGES.find(l => l.code === langCode) || LANGUAGES[0];
  const selectedTheme = THEMES.find(th => th.code === themeCode) || THEMES[0];

  // Modal background adapts to theme
  const modalBg = isDark ? '#1a1640' : '#ffffff';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
            <Text style={{ color: C.text, fontSize: 26, fontWeight: '800' }}>{t('settings')}</Text>
          </View>

          {/* Profile Card */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginBottom: 24, backgroundColor: C.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border }}
            onPress={() => router.push('/profile')}
          >
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: C.purple + '44', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.purple }}>
              <Text style={{ color: C.purple, fontWeight: '800', fontSize: 20 }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>{fullName}</Text>
              <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{user?.email}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: C.teal + '33', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.teal + '55' }}>
                <Text style={{ color: C.teal, fontSize: 12, fontWeight: '700' }}>{t('free')}</Text>
              </View>
              <Text style={{ color: C.muted, fontSize: 20 }}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Account Section */}
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 20, marginBottom: 8 }}>{t('account')}</Text>
          <View style={{ marginHorizontal: 16, marginBottom: 20, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }} onPress={() => router.push('/profile')}>
              <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>👤</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{t('profile')}</Text>
                <Text style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>{t('editDetails')}</Text>
              </View>
              <Text style={{ color: C.muted, fontSize: 20 }}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: 1, borderTopColor: C.border }} onPress={() => router.push('/change-password')}>
              <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>🔒</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{t('password')}</Text>
                <Text style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>{t('changePassword')}</Text>
              </View>
              <Text style={{ color: C.muted, fontSize: 20 }}>›</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: 1, borderTopColor: C.border }}>
              <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>🔔</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{t('notifications')}</Text>
                <Text style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>{t('budgetAlerts')}</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: C.purple + '88' }}
                thumbColor={notificationsEnabled ? C.purple : 'rgba(255,255,255,0.4)'}
              />
            </View>
          </View>

          {/* App Section */}
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 20, marginBottom: 8 }}>{t('app')}</Text>
          <View style={{ marginHorizontal: 16, marginBottom: 20, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }} onPress={() => setShowCurrencyPicker(true)}>
              <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>💱</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{t('currency')}</Text>
                <Text style={{ color: C.purple, fontSize: 12, marginTop: 1, fontWeight: '700' }}>{currentCurrency}</Text>
              </View>
              <Text style={{ color: C.muted, fontSize: 20 }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: 1, borderTopColor: C.border }}
              onPress={() => setShowLanguagePicker(true)}
            >
              <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>🌍</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{t('language')}</Text>
                <Text style={{ color: C.purple, fontSize: 12, marginTop: 1, fontWeight: '700' }}>{selectedLang.flag} {selectedLang.name}</Text>
              </View>
              <Text style={{ color: C.muted, fontSize: 20 }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: 1, borderTopColor: C.border }}
              onPress={() => setShowThemePicker(true)}
            >
              <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>🌙</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{t('theme')}</Text>
                <Text style={{ color: C.purple, fontSize: 12, marginTop: 1, fontWeight: '700' }}>{selectedTheme.emoji} {selectedTheme.name}</Text>
              </View>
              <Text style={{ color: C.muted, fontSize: 20 }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: 20, marginBottom: 8 }}>{t('info')}</Text>
          <View style={{ marginHorizontal: 16, marginBottom: 20, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>🔌</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{t('api')}</Text>
                <Text style={{ color: C.muted, fontSize: 12, marginTop: 1 }} numberOfLines={1}>{API_URL}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: 1, borderTopColor: C.border }}>
              <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>📦</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{t('version')}</Text>
                <Text style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>1.0.0</Text>
              </View>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={{ marginHorizontal: 16, borderRadius: 16, padding: 16, alignItems: 'center', backgroundColor: C.red + '22', borderWidth: 1, borderColor: C.red + '44', marginBottom: 32 }}
            onPress={handleLogout}
          >
            <Text style={{ color: C.red, fontSize: 16, fontWeight: '700' }}>{t('logout')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* ── Currency Picker Modal ── */}
      <Modal visible={showCurrencyPicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{t('selectCurrency')}</Text>
              <TouchableOpacity onPress={() => { setShowCurrencyPicker(false); setSearch(''); }}>
                <Text style={{ color: C.muted, fontSize: 24 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
              <TextInput
                style={{ flex: 1, color: C.text, paddingVertical: 11, fontSize: 14 }}
                placeholder={t('searchCurrency')}
                placeholderTextColor={C.muted}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
            </View>
            {saving ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={C.purple} />
                <Text style={{ color: C.muted, marginTop: 12 }}>{t('updatingCurrency')}</Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.code}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
                renderItem={({ item }) => {
                  const isSelected = item.code === currentCurrency;
                  return (
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 6, backgroundColor: isSelected ? C.purple + '22' : C.card, borderWidth: 1, borderColor: isSelected ? C.purple : C.border }}
                      onPress={() => handleCurrencySelect(item)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: C.text, fontSize: 14, fontWeight: '700' }}>{item.code}</Text>
                        <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{item.name}</Text>
                      </View>
                      {item.symbol && <Text style={{ color: isSelected ? C.purple : C.muted, fontSize: 18, fontWeight: '700', marginRight: 8 }}>{item.symbol}</Text>}
                      {isSelected && <Text style={{ color: C.purple, fontSize: 18 }}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={<View style={{ alignItems: 'center', paddingTop: 40 }}><Text style={{ color: C.muted, fontSize: 15 }}>{t('noCurrencies')}</Text></View>}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ── Language Picker Modal ── */}
      <Modal visible={showLanguagePicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{t('selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <Text style={{ color: C.muted, fontSize: 24 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              {LANGUAGES.map((lang) => {
                const isSelected = lang.code === langCode;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 8, backgroundColor: isSelected ? C.purple + '22' : C.card, borderWidth: 1, borderColor: isSelected ? C.purple : C.border }}
                    onPress={() => handleLanguageSelect(lang)}
                  >
                    <Text style={{ fontSize: 24, marginRight: 14 }}>{lang.flag}</Text>
                    <Text style={{ color: C.text, fontSize: 15, fontWeight: isSelected ? '700' : '500', flex: 1 }}>{lang.name}</Text>
                    {isSelected && <Text style={{ color: C.purple, fontSize: 20 }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Theme Picker Modal ── */}
      <Modal visible={showThemePicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{t('selectTheme')}</Text>
              <TouchableOpacity onPress={() => setShowThemePicker(false)}>
                <Text style={{ color: C.muted, fontSize: 24 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              {THEMES.map((theme) => {
                const isSelected = theme.code === themeCode;
                return (
                  <TouchableOpacity
                    key={theme.code}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 8, backgroundColor: isSelected ? C.purple + '22' : C.card, borderWidth: 1, borderColor: isSelected ? C.purple : C.border }}
                    onPress={() => handleThemeSelect(theme)}
                  >
                    <Text style={{ fontSize: 24, marginRight: 14 }}>{theme.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.text, fontSize: 15, fontWeight: isSelected ? '700' : '500' }}>{theme.name}</Text>
                      <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{theme.desc}</Text>
                    </View>
                    {isSelected && <Text style={{ color: C.purple, fontSize: 20 }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
