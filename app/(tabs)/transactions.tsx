import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getTransactions, getWallets, deleteTransaction, getCurrencies } from '../../services/api';

const C = { bg:'#0f0c29',card:'rgba(255,255,255,0.06)',border:'rgba(255,255,255,0.10)',text:'#ffffff',muted:'rgba(255,255,255,0.55)',purple:'#6C63FF',green:'#4ade80',red:'#f87171' };
const fmt = (n:any) => parseFloat(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const ICONS: Record<string,string> = {'Groceries':'🛒','Dining':'🍽️','Transportation':'🚗','Entertainment':'🎬','Utilities':'⚡','Healthcare':'🏥','Shopping':'🛍️','Subscriptions':'📱','Salary':'💼','Freelance':'💻','Investment':'📈','Rent':'🏠','Education':'📚','Other':'💳','Other Income':'💰'};

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [totals, setTotals] = useState({income:0,expense:0});
  const [currencySymbol, setCurrencySymbol] = useState('$');

  const loadData = useCallback(async () => {
    try {
      const wRes = await getWallets();
      const ws = wRes.data.results||wRes.data;
      if (ws?.length>0) {
        const w = ws[0];

        // Fetch currency symbol
        const cRes = await getCurrencies();
        const currencies = cRes.data.results||cRes.data;
        const match = currencies.find((c:any) => c.code === w.base_currency);
        if (match?.symbol) setCurrencySymbol(match.symbol);

        const tRes = await getTransactions(w.id);
        const list = tRes.data.results||tRes.data;
        const txs = Array.isArray(list)?list:[];
        setTransactions(txs);
        setTotals({
          income: txs.filter((t:any)=>t.transaction_type==='income').reduce((s:number,t:any)=>s+parseFloat(t.amount),0),
          expense: txs.filter((t:any)=>t.transaction_type==='expense').reduce((s:number,t:any)=>s+parseFloat(t.amount),0)
        });
      }
    } catch(e){ console.log(e); }
    finally{ setLoading(false); setRefreshing(false); }
  },[]);

  useEffect(()=>{ loadData(); },[]);

  const handleDelete = (id:number) => Alert.alert('Delete','Are you sure?',[
    {text:'Cancel',style:'cancel'},
    {text:'Delete',style:'destructive',onPress:async()=>{
      try{ await deleteTransaction(id); setTransactions(p=>p.filter(t=>t.id!==id)); }
      catch{ Alert.alert('Error','Could not delete.'); }
    }}
  ]);

  const filtered = transactions
    .filter(t=>filter==='All'||t.transaction_type===filter.toLowerCase())
    .filter(t=>!search||t.description?.toLowerCase().includes(search.toLowerCase())||t.category_detail?.name?.toLowerCase().includes(search.toLowerCase()));

  const grouped = filtered.reduce((acc:any,t:any)=>{
    if(!acc[t.date]) acc[t.date]=[];
    acc[t.date].push(t);
    return acc;
  },{});

  if(loading) return (
    <View style={{flex:1,backgroundColor:C.bg,justifyContent:'center',alignItems:'center'}}>
      <ActivityIndicator size="large" color={C.purple}/>
    </View>
  );

  return (
    <View style={{flex:1,backgroundColor:C.bg}}>
      <StatusBar barStyle="light-content"/>
      <SafeAreaView style={{flex:1}}>
        {/* Header */}
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:20,paddingTop:8,paddingBottom:12}}>
          <Text style={{color:C.text,fontSize:26,fontWeight:'800'}}>Transactions</Text>
          <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:12,paddingHorizontal:16,paddingVertical:8}} onPress={()=>router.push('/add-transaction')}>
            <Text style={{color:'#fff',fontWeight:'700',fontSize:14}}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Totals */}
        <View style={{flexDirection:'row',gap:10,paddingHorizontal:16,marginBottom:12}}>
          <View style={{flex:1,borderRadius:14,padding:12,borderWidth:1,backgroundColor:C.green+'22',borderColor:C.green+'44'}}>
            <Text style={{fontSize:11,fontWeight:'600',color:C.green,marginBottom:2}}>↑ Income</Text>
            <Text style={{fontSize:16,fontWeight:'800',color:C.green}}>{currencySymbol}{fmt(totals.income)}</Text>
          </View>
          <View style={{flex:1,borderRadius:14,padding:12,borderWidth:1,backgroundColor:C.red+'22',borderColor:C.red+'44'}}>
            <Text style={{fontSize:11,fontWeight:'600',color:C.red,marginBottom:2}}>↓ Expense</Text>
            <Text style={{fontSize:16,fontWeight:'800',color:C.red}}>{currencySymbol}{fmt(totals.expense)}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={{flexDirection:'row',alignItems:'center',marginHorizontal:16,marginBottom:12,backgroundColor:C.card,borderRadius:14,paddingHorizontal:14,borderWidth:1,borderColor:C.border}}>
          <Text style={{fontSize:14,marginRight:8}}>🔍</Text>
          <TextInput
            style={{flex:1,color:C.text,paddingVertical:11,fontSize:14}}
            placeholder="Search..."
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter Tabs */}
        <View style={{flexDirection:'row',paddingHorizontal:16,gap:8,marginBottom:12}}>
          {['All','Income','Expense'].map(f=>(
            <TouchableOpacity
              key={f}
              style={{paddingHorizontal:18,paddingVertical:8,borderRadius:20,backgroundColor:filter===f?C.purple:C.card,borderWidth:1,borderColor:filter===f?C.purple:C.border}}
              onPress={()=>setFilter(f)}
            >
              <Text style={{color:filter===f?'#fff':C.muted,fontSize:13,fontWeight:'600'}}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal:16}}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);loadData();}} tintColor={C.purple}/>}
        >
          {Object.keys(grouped).length===0 ? (
            <View style={{alignItems:'center',paddingTop:80}}>
              <Text style={{fontSize:52,marginBottom:16}}>📭</Text>
              <Text style={{color:C.muted,fontSize:16,marginBottom:20}}>No transactions found</Text>
              <TouchableOpacity style={{backgroundColor:C.purple,borderRadius:14,paddingHorizontal:24,paddingVertical:13}} onPress={()=>router.push('/add-transaction')}>
                <Text style={{color:'#fff',fontWeight:'700',fontSize:14}}>Add your first transaction</Text>
              </TouchableOpacity>
            </View>
          ) : Object.keys(grouped).sort((a,b)=>b.localeCompare(a)).map(date=>(
            <View key={date}>
              <Text style={{color:C.muted,fontSize:12,fontWeight:'700',marginBottom:8,marginTop:4,textTransform:'uppercase',letterSpacing:0.5}}>{date}</Text>
              {grouped[date].map((t:any)=>{
                const isIncome = t.transaction_type==='income';
                const icon = ICONS[t.category_detail?.name]||(isIncome?'💰':'💳');
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:C.card,borderRadius:16,padding:14,marginBottom:8,borderWidth:1,borderColor:C.border}}
                    onLongPress={()=>handleDelete(t.id)}
                    activeOpacity={0.75}
                  >
                    <View style={{width:44,height:44,borderRadius:14,justifyContent:'center',alignItems:'center',backgroundColor:(isIncome?C.green:C.red)+'22'}}>
                      <Text style={{fontSize:20}}>{icon}</Text>
                    </View>
                    <View style={{flex:1}}>
                      <Text style={{color:C.text,fontSize:14,fontWeight:'600'}}>{t.description||t.category_detail?.name||'Transaction'}</Text>
                      <Text style={{color:C.muted,fontSize:11,marginTop:2}}>{t.category_detail?.name||'Uncategorized'}</Text>
                    </View>
                    <View style={{alignItems:'flex-end'}}>
                      <Text style={{fontSize:15,fontWeight:'800',color:isIncome?C.green:C.red}}>{isIncome?'+':'-'}{currencySymbol}{fmt(t.amount)}</Text>
                      <View style={{paddingHorizontal:8,paddingVertical:2,borderRadius:6,marginTop:3,backgroundColor:(isIncome?C.green:C.red)+'22'}}>
                        <Text style={{fontSize:10,fontWeight:'600',color:isIncome?C.green:C.red}}>{isIncome?'Income':'Expense'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <View style={{height:24}}/>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
