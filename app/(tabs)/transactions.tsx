import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getWallets, getCategories, addTransaction } from '../../services/database';

const C = { bg: '#0f0c29', card: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.10)', text: '#ffffff', muted: 'rgba(255,255,255,0.55)', purple: '#6C63FF', teal: '#3ECFCF', green: '#4ade80', red: '#f87171' };

export default function AddTransactionScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [walletsData, categoriesData] = await Promise.all([
      getWallets(),
      getCategories()
    ]);
    setWallets(walletsData);
    setCategories(categoriesData);
    if (walletsData.length > 0) setSelectedWallet(walletsData[0]);
    if (categoriesData.length > 0) setSelectedCategory(categoriesData[0]);
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!selectedWallet) {
      Alert.alert('Error', 'Please select a wallet');
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        wallet_id: selectedWallet.id,
        category_id: selectedCategory?.id || null,
        amount: numAmount,
        transaction_type: type,
        description: description.trim() || null,
        date: new Date().toISOString().split('T')[0],
        currency: selectedWallet.base_currency,
        created_at: Date.now(),
        updated_at: Date.now()
      });
      Alert.alert('Success', 'Transaction added!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ padding: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: C.text, marginBottom: 20 }}>Add Transaction</Text>

          {/* Type Selector */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <TouchableOpacity onPress={() => setType('expense')} style={{ flex: 1, backgroundColor: type === 'expense' ? C.red : C.card, padding: 14, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: C.text, fontWeight: '600' }}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setType('income')} style={{ flex: 1, backgroundColor: type === 'income' ? C.green : C.card, padding: 14, borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: C.text, fontWeight: '600' }}>Income</Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <Text style={{ color: C.muted, marginBottom: 5 }}>Amount</Text>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" placeholderTextColor="#666" style={{ backgroundColor: C.card, color: C.text, padding: 15, borderRadius: 12, fontSize: 18, marginBottom: 15 }} />

          {/* Description */}
          <Text style={{ color: C.muted, marginBottom: 5 }}>Description (optional)</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Coffee, Groceries..." placeholderTextColor="#666" style={{ backgroundColor: C.card, color: C.text, padding: 15, borderRadius: 12, marginBottom: 15 }} />

          {/* Wallet Selector */}
          <Text style={{ color: C.muted, marginBottom: 5 }}>Wallet</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
            {wallets.map(w => (
              <TouchableOpacity key={w.id} onPress={() => setSelectedWallet(w)} style={{ backgroundColor: selectedWallet?.id === w.id ? C.purple : C.card, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10 }}>
                <Text style={{ color: C.text }}>{w.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Category Selector */}
          <Text style={{ color: C.muted, marginBottom: 5 }}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 25 }}>
            {categories.filter(c => c.type === type).map(c => (
              <TouchableOpacity key={c.id} onPress={() => setSelectedCategory(c)} style={{ backgroundColor: selectedCategory?.id === c.id ? C.purple : C.card, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14 }}>{c.icon || (c.type === 'income' ? '💰' : '💳')}</Text>
                <Text style={{ color: C.text }}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity onPress={handleSave} disabled={loading} style={{ backgroundColor: C.purple, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 30 }}>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: 'bold' }}>{loading ? 'Saving...' : 'Save Transaction'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}