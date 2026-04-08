import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar, Modal, TextInput, Alert, Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkBudgetsAndNotify } from '../../services/notifications';

const C = {
  bg: '#0f0c29', card: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.10)',
  text: '#ffffff', muted: 'rgba(255,255,255,0.55)', purple: '#6C63FF',
  teal: '#3ECFCF', green: '#4ade80', red: '#f87171', amber: '#fbbf24', blue: '#60a5fa'
};
const fmt = (n: any) => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ICONS: Record<string, string> = {
  'Groceries':'🛒','Dining':'🍽️','Transportation':'🚗','Entertainment':'🎬',
  'Utilities':'⚡','Healthcare':'🏥','Shopping':'🛍️','Subscriptions':'📱',
  'Salary':'💼','Freelance':'💻','Investment':'📈','Rent':'🏠',
  'Education':'📚','Other':'💳','Other Income':'💰'
};

export default function BudgetScreen() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<'monthly'|'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [wallet, setWallet] = useState<any>(null);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategory, setBudgetCategory] = useState<any>(null);
  const [savingBudget, setSavingBudget] = useState(false);
  const notifiedRef = useRef<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const wRes = await getWallets();
      const ws = wRes.data.results || wRes.data;
      if (!ws?.length) return;
      const w = ws[0];
      setWallet(w);

      const [cRes, tRes, bRes, catRes] = await Promise.all([
        getCurrencies(),
        getTransactions(w.id),
        api.get(`/budgets/?wallet_id=${w.id}`),
        getCategories(w.id)
      ]);

      const currencies = cRes.data.results || cRes.data;
      const match = currencies.find((c: any) => c.code === w.base_currency);
      const symbol = match?.symbol || '$';
      setCurrencySymbol(symbol);

      const txList = tRes.data.results || tRes.data;
      setTransactions(Array.isArray(txList) ? txList : []);

      const budgetList = bRes.data.results || bRes.data;
      const budgets = Array.isArray(budgetList) ? budgetList : [];
      setBudgets(budgets);

      const catList = catRes.data.results || catRes.data;
      const cats = Array.isArray(catList) ? catList : [];
      setCategories(cats);

      // Enrich budgets with category name for notifications
      const enriched = budgets.map((b: any) => ({
        ...b,
        category_name: cats.find((c: any) => c.id === b.category)?.name || `Budget #${b.id}`
      }));

      // Fire notifications for budgets at/over threshold
      await checkBudgetsAndNotify(enriched, symbol, notifiedRef.current);

    } catch (e) { console.log('Budget load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, []);

  const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const monthTxs = transactions.filter(t => t.date?.startsWith(monthKey));
  const monthIncome = monthTxs.filter(t => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const monthExpense = monthTxs.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const monthSavings = monthIncome - monthExpense;
  const savingsRate = monthIncome > 0 ? Math.round((monthSavings / monthIncome) * 100) : 0;

  const healthScore = savingsRate >= 20 ? 'great' : savingsRate >= 0 ? 'ok' : 'bad';
  const healthColor = healthScore === 'great' ? C.green : healthScore === 'ok' ? C.amber : C.red;
  const healthLabel = healthScore === 'great' ? '🟢 Healthy' : healthScore === 'ok' ? '🟡 Break Even' : '🔴 Overspent';

  const incomeByCategory = monthTxs.filter(t => t.transaction_type === 'income').reduce((acc: any, t: any) => {
    const name = t.category_detail?.name || 'Other';
    acc[name] = (acc[name] || 0) + parseFloat(t.amount);
    return acc;
  }, {});

  const expenseByCategory = monthTxs.filter(t => t.transaction_type === 'expense').reduce((acc: any, t: any) => {
    const name = t.category_detail?.name || 'Other';
    acc[name] = (acc[name] || 0) + parseFloat(t.amount);
    return acc;
  }, {});

  const monthBudgets = budgets.filter(b => b.month === monthKey);

  const yearlyData = Array.from({ length: 12 }, (_, i) => {
    const mk = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
    const txs = transactions.filter(t => t.date?.startsWith(mk));
    const inc = txs.filter(t => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
    const exp = txs.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
    return { month: MONTHS[i], income: inc, expense: exp, savings: inc - exp };
  });

  const yearIncome = yearlyData.reduce((s, m) => s + m.income, 0);
  const yearExpense = yearlyData.reduce((s, m) => s + m.expense, 0);
  const yearSavings = yearIncome - yearExpense;
  const bestMonth = yearlyData.reduce((best, m) => m.savings > best.savings ? m : best, yearlyData[0]);
  const worstMonth = yearlyData.reduce((worst, m) => m.savings < worst.savings ? m : worst, yearlyData[0]);
  const maxBar = Math.max(...yearlyData.map(m => Math.max(m.income, m.expense)), 1);

  let cumulative = 0;
  const cumulativeSavings = yearlyData.map(m => { cumulative += m.savings; return cumulative; });

  const handleSaveBudget = async () => {
    if (!budgetCategory) { Alert.alert('Error', 'Select a category.'); return; }
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    setSavingBudget(true);
    try {
      const existing = monthBudgets.find(b => b.category === budgetCategory.id);
      if (existing) {
        await api.patch(`/budgets/${existing.id}/`, { amount: parseFloat(budgetAmount) });
      } else {
        await api.post('/budgets/', { wallet: wallet.id, category: budgetCategory.id, amount: parseFloat(budgetAmount), month: monthKey });
      }
      setShowBudgetModal(false);
      setBudgetAmount('');
      setBudgetCategory(null);
      await loadData();
    } catch (e: any) {
      Alert.alert('Error', JSON.stringify(e?.response?.data || 'Failed to save budget'));
    } finally { setSavingBudget(false); }
  };

  const handleDeleteBudget = (id: number) => Alert.alert('Delete Budget', 'Remove this budget limit?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await api.delete(`/budgets/${id}/`); await loadData(); }
      catch { Alert.alert('Error', 'Could not delete budget.'); }
    }}
  ]);

  const handleShare = async () => {
    const month = `${MONTHS[selectedMonth]} ${selectedYear}`;
    const msg = activeTab === 'monthly'
      ? `📊 ${month} Summary\n\n✅ Income: ${currencySymbol}${fmt(monthIncome)}\n❌ Expenses: ${currencySymbol}${fmt(monthExpense)}\n💰 Saved: ${currencySymbol}${fmt(monthSavings)} (${savingsRate}%)\n\nStatus: ${healthLabel}`
      : `📊 ${selectedYear} Year Summary\n\n✅ Total Income: ${currencySymbol}${fmt(yearIncome)}\n❌ Total Expenses: ${currencySymbol}${fmt(yearExpense)}\n💰 Total Saved: ${currencySymbol}${fmt(yearSavings)}\n\n🏆 Best Month: ${bestMonth.month} (${currencySymbol}${fmt(bestMonth.savings)})\n📉 Worst Month: ${worstMonth.month} (${currencySymbol}${fmt(worstMonth.savings)})`;
    await Share.share({ message: msg });
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={C.purple} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Text style={{ color: C.text, fontSize: 26, fontWeight: '800' }}>Budget</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={handleShare} style={{ backgroundColor: C.card, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontSize: 16 }}>↗️</Text>
            </TouchableOpacity>
            {activeTab === 'monthly' && (
              <TouchableOpacity onPress={() => setShowBudgetModal(true)} style={{ backgroundColor: C.purple, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+ Budget</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: C.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.border }}>
          {(['monthly', 'yearly'] as const).map(tab => (
            <TouchableOpacity key={tab} style={{ flex: 1, paddingVertical: 9, borderRadius: 11, backgroundColor: activeTab === tab ? C.purple : 'transparent', alignItems: 'center' }} onPress={() => setActiveTab(tab)}>
              <Text style={{ color: activeTab === tab ? '#fff' : C.muted, fontWeight: '700', fontSize: 13, textTransform: 'capitalize' }}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={C.purple} />}>
          {activeTab === 'monthly' ? (
            <>
              {/* Month Navigator */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 }}>
                <TouchableOpacity onPress={() => { if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); } else setSelectedMonth(m => m - 1); }} style={{ padding: 8 }}>
                  <Text style={{ color: C.purple, fontSize: 22 }}>‹</Text>
                </TouchableOpacity>
                <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{MONTHS[selectedMonth]} {selectedYear}</Text>
                <TouchableOpacity onPress={() => { if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); } else setSelectedMonth(m => m + 1); }} style={{ padding: 8 }}>
                  <Text style={{ color: C.purple, fontSize: 22 }}>›</Text>
                </TouchableOpacity>
              </View>

              {/* Health Score */}
              <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: healthColor + '22', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: healthColor + '44', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: C.text, fontSize: 15, fontWeight: '700' }}>Month Health</Text>
                <Text style={{ color: healthColor, fontSize: 14, fontWeight: '800' }}>{healthLabel}</Text>
              </View>

              {/* Summary Cards */}
              <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: C.green + '22', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.green + '44' }}>
                  <Text style={{ color: C.green, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>↑ Income</Text>
                  <Text style={{ color: C.green, fontSize: 17, fontWeight: '900' }}>{currencySymbol}{fmt(monthIncome)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: C.red + '22', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.red + '44' }}>
                  <Text style={{ color: C.red, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>↓ Expense</Text>
                  <Text style={{ color: C.red, fontSize: 17, fontWeight: '900' }}>{currencySymbol}{fmt(monthExpense)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: C.blue + '22', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.blue + '44' }}>
                  <Text style={{ color: C.blue, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>💰 Saved</Text>
                  <Text style={{ color: C.blue, fontSize: 17, fontWeight: '900' }}>{savingsRate}%</Text>
                </View>
              </View>

              {/* Budget Limits */}
              {monthBudgets.length > 0 && (
                <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
                  <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Budget Limits</Text>
                  {monthBudgets.map(b => {
                    const pct = Math.min(b.percentage_spent || 0, 100);
                    const isOver = b.is_exceeded;
                    const isWarn = pct >= (b.alert_threshold || 80);
                    const barColor = isOver ? C.red : isWarn ? C.amber : C.green;
                    const catName = categories.find(c => c.id === b.category)?.name || 'Category';
                    return (
                      <TouchableOpacity key={b.id} onLongPress={() => handleDeleteBudget(b.id)} style={{ backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: isOver ? C.red + '66' : isWarn ? C.amber + '66' : C.border }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 18 }}>{ICONS[catName] || '💳'}</Text>
                            <Text style={{ color: C.text, fontSize: 14, fontWeight: '700' }}>{catName}</Text>
                          </View>
                          <Text style={{ color: barColor, fontSize: 13, fontWeight: '700' }}>{pct.toFixed(0)}%</Text>
                        </View>
                        <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 8 }}>
                          <View style={{ height: 8, backgroundColor: barColor, borderRadius: 4, width: `${pct}%` }} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: C.muted, fontSize: 11 }}>Spent: {currencySymbol}{fmt(b.spent_amount)}</Text>
                          <Text style={{ color: C.muted, fontSize: 11 }}>Limit: {currencySymbol}{fmt(b.amount)}</Text>
                          <Text style={{ color: isOver ? C.red : C.green, fontSize: 11, fontWeight: '600' }}>{isOver ? 'EXCEEDED' : `${currencySymbol}${fmt(b.remaining_amount)} left`}</Text>
                        </View>
                        {isWarn && !isOver && <Text style={{ color: C.amber, fontSize: 11, marginTop: 6 }}>⚠️ Approaching limit</Text>}
                        {isOver && <Text style={{ color: C.red, fontSize: 11, marginTop: 6 }}>🚨 Budget exceeded!</Text>}
                      </TouchableOpacity>
                    );
                  })}
                  <Text style={{ color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 2 }}>Long press a budget to delete it</Text>
                </View>
              )}

              {/* Income Breakdown */}
              {Object.keys(incomeByCategory).length > 0 && (
                <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
                  <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Income Sources</Text>
                  {Object.entries(incomeByCategory).map(([name, amt]: any) => (
                    <View key={name} style={{ backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ fontSize: 20 }}>{ICONS[name] || '💰'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{name}</Text>
                        <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 6 }}>
                          <View style={{ height: 4, backgroundColor: C.green, borderRadius: 2, width: `${monthIncome > 0 ? (amt / monthIncome) * 100 : 0}%` }} />
                        </View>
                      </View>
                      <Text style={{ color: C.green, fontSize: 14, fontWeight: '800' }}>{currencySymbol}{fmt(amt)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Expense Breakdown */}
              {Object.keys(expenseByCategory).length > 0 && (
                <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
                  <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Expense Breakdown</Text>
                  {Object.entries(expenseByCategory).map(([name, amt]: any) => (
                    <View key={name} style={{ backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ fontSize: 20 }}>{ICONS[name] || '💳'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{name}</Text>
                        <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 6 }}>
                          <View style={{ height: 4, backgroundColor: C.red, borderRadius: 2, width: `${monthExpense > 0 ? (amt / monthExpense) * 100 : 0}%` }} />
                        </View>
                      </View>
                      <Text style={{ color: C.red, fontSize: 14, fontWeight: '800' }}>{currencySymbol}{fmt(amt)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {monthTxs.length === 0 && (
                <View style={{ alignItems: 'center', paddingTop: 60 }}>
                  <Text style={{ fontSize: 52, marginBottom: 12 }}>📭</Text>
                  <Text style={{ color: C.muted, fontSize: 15 }}>No transactions this month</Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Year Navigator */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 }}>
                <TouchableOpacity onPress={() => setSelectedYear(y => y - 1)} style={{ padding: 8 }}>
                  <Text style={{ color: C.purple, fontSize: 22 }}>‹</Text>
                </TouchableOpacity>
                <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{selectedYear} Summary</Text>
                <TouchableOpacity onPress={() => setSelectedYear(y => y + 1)} style={{ padding: 8 }}>
                  <Text style={{ color: C.purple, fontSize: 22 }}>›</Text>
                </TouchableOpacity>
              </View>

              {/* Year Totals */}
              <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Year Totals</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>↑ Income</Text>
                    <Text style={{ color: C.green, fontSize: 16, fontWeight: '900' }}>{currencySymbol}{fmt(yearIncome)}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>↓ Expenses</Text>
                    <Text style={{ color: C.red, fontSize: 16, fontWeight: '900' }}>{currencySymbol}{fmt(yearExpense)}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>💰 Saved</Text>
                    <Text style={{ color: yearSavings >= 0 ? C.blue : C.red, fontSize: 16, fontWeight: '900' }}>{currencySymbol}{fmt(yearSavings)}</Text>
                  </View>
                </View>
              </View>

              {/* Best / Worst Month */}
              <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: C.green + '22', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.green + '44' }}>
                  <Text style={{ color: C.green, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>🏆 Best Month</Text>
                  <Text style={{ color: C.text, fontSize: 15, fontWeight: '800' }}>{bestMonth.month}</Text>
                  <Text style={{ color: C.green, fontSize: 12, marginTop: 2 }}>{currencySymbol}{fmt(bestMonth.savings)} saved</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: C.red + '22', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.red + '44' }}>
                  <Text style={{ color: C.red, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>📉 Worst Month</Text>
                  <Text style={{ color: C.text, fontSize: 15, fontWeight: '800' }}>{worstMonth.month}</Text>
                  <Text style={{ color: C.red, fontSize: 12, marginTop: 2 }}>{currencySymbol}{fmt(worstMonth.savings)} net</Text>
                </View>
              </View>

              {/* Bar Chart */}
              <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: C.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Income vs Expenses</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 }}>
                  {yearlyData.map((m, i) => (
                    <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1, height: 80 }}>
                        <View style={{ width: 5, backgroundColor: C.green, borderRadius: 3, height: Math.max((m.income / maxBar) * 80, m.income > 0 ? 4 : 0) }} />
                        <View style={{ width: 5, backgroundColor: C.red, borderRadius: 3, height: Math.max((m.expense / maxBar) * 80, m.expense > 0 ? 4 : 0) }} />
                      </View>
                      <Text style={{ color: C.muted, fontSize: 8, marginTop: 4 }}>{m.month.slice(0, 1)}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, backgroundColor: C.green, borderRadius: 2 }} />
                    <Text style={{ color: C.muted, fontSize: 11 }}>Income</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, backgroundColor: C.red, borderRadius: 2 }} />
                    <Text style={{ color: C.muted, fontSize: 11 }}>Expenses</Text>
                  </View>
                </View>
              </View>

              {/* Cumulative Savings */}
              <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: C.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Cumulative Savings</Text>
                <Text style={{ color: C.blue, fontSize: 22, fontWeight: '900', marginBottom: 4 }}>{currencySymbol}{fmt(cumulativeSavings[now.getMonth()])}</Text>
                <Text style={{ color: C.muted, fontSize: 12 }}>Accumulated so far this year</Text>
              </View>

              {/* Monthly Breakdown Table */}
              <View style={{ marginHorizontal: 16, marginBottom: 20, backgroundColor: C.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Month by Month</Text>
                {yearlyData.map((m, i) => {
                  const hasData = m.income > 0 || m.expense > 0;
                  return (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: C.border }}>
                      <Text style={{ color: hasData ? C.text : C.muted, fontSize: 13, fontWeight: '700', width: 36 }}>{m.month}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: C.green, fontSize: 11 }}>{currencySymbol}{fmt(m.income)}</Text>
                          <Text style={{ color: C.red, fontSize: 11 }}>{currencySymbol}{fmt(m.expense)}</Text>
                          <Text style={{ color: m.savings >= 0 ? C.blue : C.red, fontSize: 11, fontWeight: '700' }}>{m.savings >= 0 ? '+' : ''}{currencySymbol}{fmt(m.savings)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
                <View style={{ flexDirection: 'row', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border }}>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: '800', width: 36 }}>Tot</Text>
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: C.green, fontSize: 12, fontWeight: '800' }}>{currencySymbol}{fmt(yearIncome)}</Text>
                    <Text style={{ color: C.red, fontSize: 12, fontWeight: '800' }}>{currencySymbol}{fmt(yearExpense)}</Text>
                    <Text style={{ color: yearSavings >= 0 ? C.blue : C.red, fontSize: 12, fontWeight: '800' }}>{yearSavings >= 0 ? '+' : ''}{currencySymbol}{fmt(yearSavings)}</Text>
                  </View>
                </View>
              </View>
            </>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Add Budget Modal */}
      <Modal visible={showBudgetModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1a1640', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>Set Budget Limit</Text>
              <TouchableOpacity onPress={() => { setShowBudgetModal(false); setBudgetAmount(''); setBudgetCategory(null); }}>
                <Text style={{ color: C.muted, fontSize: 24 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Month</Text>
            <View style={{ backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ color: C.text, fontSize: 15, fontWeight: '600' }}>{MONTHS[selectedMonth]} {selectedYear}</Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {categories.filter(c => c.type === 'expense').map(cat => {
                  const sel = budgetCategory?.id === cat.id;
                  return (
                    <TouchableOpacity key={cat.id} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: sel ? C.purple : C.card, borderWidth: 1, borderColor: sel ? C.purple : C.border, flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => setBudgetCategory(sel ? null : cat)}>
                      <Text style={{ fontSize: 14 }}>{ICONS[cat.name] || '💳'}</Text>
                      <Text style={{ color: sel ? '#fff' : C.muted, fontSize: 13, fontWeight: '600' }}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Budget Amount</Text>
            <TextInput
              style={{ backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 18, color: C.text, marginBottom: 20, borderWidth: 1, borderColor: C.border, fontWeight: '700' }}
              placeholder={`${currencySymbol}0.00`}
              placeholderTextColor={C.muted}
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={{ backgroundColor: C.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }} onPress={handleSaveBudget} disabled={savingBudget}>
              {savingBudget ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Save Budget</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
