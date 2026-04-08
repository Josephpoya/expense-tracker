import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getTransactions, getWallets, getCategories, initDatabase } from '../../services/database';

const C = { bg: '#0f0c29', card: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.10)', text: '#ffffff', muted: 'rgba(255,255,255,0.55)', purple: '#6C63FF', teal: '#3ECFCF', green: '#4ade80', red: '#f87171', blue: '#60a5fa', amber: '#fbbf24' };
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

export default function DashboardScreen() {
  const [wallet, setWallet] = useState<any>(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Initialize database if needed
      await initDatabase();
      
      // Get all data
      const wallets = await getWallets();
      const transactions = await getTransactions();
      const categories = await getCategories();
      
      if (wallets.length === 0) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const w = wallets[0];
      setWallet(w);
      
      // Calculate totals
      let income = 0, expense = 0;
      const walletTransactions = transactions.filter(t => t.wallet_id === w.id);
      
      for (const t of walletTransactions) {
        if (t.transaction_type === 'income') income += t.amount;
        else expense += t.amount;
      }
      setTotalIncome(income);
      setTotalExpense(expense);
      
      // Create category map
      const catMap: Record<string, any> = {};
      for (const c of categories) catMap[c.id] = c;
      
      // Get recent 5 transactions
      const sorted = [...walletTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentTxns(sorted.slice(0, 5).map(t => ({
        ...t,
        category_name: t.category_id ? catMap[t.category_id]?.name : null,
        category_icon: t.category_id ? catMap[t.category_id]?.icon : null,
      })));
    } catch (e) {
      console.log('Dashboard error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <StatusBar barStyle="light-content" />
      <ActivityIndicator size="large" color={C.purple} />
    </View>
  );

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;
  const currencySymbol = wallet?.base_currency === 'UGX' ? 'UGX ' : '$';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.purple} />}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
            <View>
              <Text style={{ color: C.muted, fontSize: 14 }}>{getGreeting()},</Text>
              <Text style={{ color: C.text, fontSize: 22, fontWeight: '800', marginTop: 2 }}>
                User
              </Text>
            </View>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.purple + '44', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: C.purple }}>
              <Text style={{ color: C.purple, fontWeight: '800', fontSize: 16 }}>U</Text>
            </View>
          </View>

          {/* Balance Card */}
          <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 24, overflow: 'hidden', elevation: 8 }}>
            <LinearGradient colors={['#6C63FF', '#3ECFCF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 22, borderRadius: 24 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                {wallet?.name || 'My Wallet'} · {wallet?.base_currency || 'USD'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 4 }}>Total Balance</Text>
              <Text style={{ color: '#fff', fontSize: 38, fontWeight: '900', letterSpacing: -1, marginBottom: 20 }}>
                {currencySymbol}{currencySymbol === '$' ? fmt(balance) : fmt(balance)}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginBottom: 4 }}>↑ Income</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: C.green }}>{currencySymbol}{fmt(totalIncome)}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginBottom: 4 }}>↓ Expenses</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: C.red }}>{currencySymbol}{fmt(totalExpense)}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginBottom: 4 }}>Savings</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: C.blue }}>{savingsRate}%</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Add', color: C.purple, icon: '+', onPress: () => router.push('/add-transaction') },
              { label: 'Transactions', color: C.teal, icon: '≡', onPress: () => router.push('/(tabs)/transactions') },
              { label: 'Budget', color: C.amber, icon: '%', onPress: () => router.push('/(tabs)/budget') },
              { label: 'Converter', color: C.teal, icon: '$', onPress: () => router.push('/currency-converter') },
            ].map(item => (
              <TouchableOpacity key={item.label} style={{ flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border }} onPress={item.onPress} activeOpacity={0.7}>
                <View style={{ width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6, backgroundColor: item.color + '33' }}>
                  <Text style={{ fontSize: 18, color: item.color, fontWeight: '700' }}>{item.icon}</Text>
                </View>
                <Text style={{ color: C.text, fontSize: 11, fontWeight: '600' }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Transactions */}
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: C.text, fontSize: 17, fontWeight: '800' }}>Recent</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={{ color: C.purple, fontSize: 13, fontWeight: '600' }}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentTxns.length === 0 ? (
              <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>💸</Text>
                <Text style={{ color: C.muted, fontSize: 14 }}>No transactions yet</Text>
                <TouchableOpacity onPress={() => router.push('/add-transaction')} style={{ marginTop: 12 }}>
                  <Text style={{ color: C.purple, fontWeight: '700' }}>Add your first one →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentTxns.map((t) => {
                const isIncome = t.transaction_type === 'income';
                return (
                  <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: (isIncome ? C.green : C.red) + '22' }}>
                      <Text style={{ fontSize: 20 }}>{t.category_icon || (isIncome ? '💰' : '💳')}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{t.description || t.category_name || 'Transaction'}</Text>
                      <Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{t.category_name || 'Uncategorized'} · {t.date}</Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: isIncome ? C.green : C.red }}>
                      {isIncome ? '+' : '-'}{currencySymbol}{fmt(t.amount)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}