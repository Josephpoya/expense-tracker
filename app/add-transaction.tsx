import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { database } from '../services/database';
import Wallet from '../services/database/models/Wallet';
import Category from '../services/database/models/Category';
import Transaction from '../services/database/models/Transaction';

const C = { bg: '#0f0c29', card: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.10)', text: '#ffffff', muted: 'rgba(255,255,255,0.55)', purple: '#6C63FF', green: '#4ade80', red: '#f87171' };

export default function AddTransactionScreen() {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const wallets = await database.collections.get<Wallet>('wallets').query().fetch();
        if (wallets.length > 0) setWallet(wallets[0]);
        const cats = await database.collections.get<Category>('categories').query().fetch();
        setCategories(cats);
      } catch (e) { console.log(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    if (!wallet) { Alert.alert('Error', 'No wallet found.'); return; }
    setSaving(true);
    try {
      await database.write(async () => {
        await database.collections.get<Transaction>('transactions').create((t) => {
          t.wallet_id = wallet.id;
          t.category_id = selectedCat?.id || '';
          t.amount = parseFloat(amount);
          t.transaction_type = type;
          t.description = description;
          t.date = date;
          t.currency = wallet.base_currency || 'USD';
          (t as any)._raw.created_at = Date.now();
          (t as any)._raw.updated_at = Date.now();
        });
      });
      Alert.alert('Saved ✅', 'Transaction added!', [
        { text: 'Add Another', onPress: () => { setAmount(''); setDescription(''); setSelectedCat(null); } },
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const filteredCats = categories.filter(c => c.type === type);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={C.purple} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: C.muted, fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: C.text, fontSize: 17, fontWeight: '700' }}>Add Transaction</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={C.purple} size="small" /> : <Text style={{ color: C.purple, fontSize: 15, fontWeight: '700' }}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {/* Type Toggle */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: type === 'expense' ? C.red : C.card, alignItems: 'center', borderWidth: 1, borderColor: type === 'expense' ? C.red : C.border }} onPress={() => { setType('expense'); setSelectedCat(null); }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: type === 'expense' ? '#fff' : C.muted }}>↓ Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: type === 'income' ? C.green : C.card, alignItems: 'center', borderWidth: 1, borderColor: type === 'income' ? C.green : C.border }} onPress={() => { setType('income'); setSelectedCat(null); }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: type === 'income' ? '#fff' : C.muted }}>↑ Income</Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 20, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontSize: 36, color: C.muted, marginRight: 8, fontWeight: '700' }}>$</Text>
              <TextInput style={{ flex: 1, fontSize: 52, fontWeight: '900', color: C.text }} placeholder="0.00" placeholderTextColor="rgba(255,255,255,0.3)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" autoFocus />
            </View>

            {/* Description */}
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</Text>
            <TextInput style={{ backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.text, marginBottom: 20, borderWidth: 1, borderColor: C.border }} placeholder="What was this for?" placeholderTextColor={C.muted} value={description} onChangeText={setDescription} />

            {/* Date */}
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</Text>
            <TextInput style={{ backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.text, marginBottom: 20, borderWidth: 1, borderColor: C.border }} placeholder="YYYY-MM-DD" placeholderTextColor={C.muted} value={date} onChangeText={setDate} />

            {/* Category */}
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {filteredCats.map(cat => {
                const sel = selectedCat?.id === cat.id;
                return (
                  <TouchableOpacity key={cat.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: sel ? C.purple : C.card, borderWidth: 1, borderColor: sel ? C.purple : C.border }} onPress={() => setSelectedCat(sel ? null : cat)}>
                    <Text style={{ fontSize: 14 }}>{cat.icon || '💳'}</Text>
                    <Text style={{ color: sel ? '#fff' : C.muted, fontSize: 13, fontWeight: '600' }}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save Button */}
            <TouchableOpacity style={{ borderRadius: 16, paddingVertical: 17, alignItems: 'center', backgroundColor: type === 'expense' ? C.red : C.green }} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{type === 'expense' ? '↓ Save Expense' : '↑ Save Income'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
