import { useEffect, useState } from 'react';
import { View, Text, StatusBar, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { api, getCurrencies } from '../services/api';

// ✅ ADD THIS
import AsyncStorage from '@react-native-async-storage/async-storage';

const C = { bg:'#0f0c29',card:'rgba(255,255,255,0.06)',border:'rgba(255,255,255,0.10)',text:'#ffffff',muted:'rgba(255,255,255,0.55)',purple:'#6C63FF',teal:'#3ECFCF' };
const POPULAR = ['USD','EUR','GBP','UGX','KES','NGN','ZAR','JPY','INR','CAD','AUD'];

export default function CurrencyConverterScreen() {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('UGX');
  const [amount, setAmount] = useState('100');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<'from'|'to'|null>(null);
  const [search, setSearch] = useState('');

  useEffect(()=>{
    getCurrencies()
      .then(r=>{
        const l=r.data.results||r.data;
        setCurrencies(Array.isArray(l)?l:[]);
      })
      .catch(()=>{});
  },[]);

  // ✅ LOAD SAVED CURRENCIES
  useEffect(() => {
    const loadSavedCurrencies = async () => {
      try {
        const from = await AsyncStorage.getItem('fromCurrency');
        const to = await AsyncStorage.getItem('toCurrency');

        if (from) setFromCurrency(from);
        if (to) setToCurrency(to);
      } catch (e) {
        console.log('Error loading currencies');
      }
    };

    loadSavedCurrencies();
  }, []);

  const convert = async()=>{
    if(!amount||parseFloat(amount)<=0){
      Alert.alert('Error','Enter a valid amount');
      return;
    }
    setLoading(true);
    try{
      const res = await api.get('/currencies/rates/',{
        params:{from:fromCurrency,to:toCurrency,amount}
      });
      setResult(res.data);
    }catch(e:any){
      const status=e?.response?.status;
      Alert.alert(
        'Error',
        status===401
          ?'Session expired. Please log out and log in again.'
          :`Could not fetch rate`
      );
    }finally{
      setLoading(false);
    }
  };

  const getCurrency = (code:string) => currencies.find(c=>c.code===code);
  const filtered = currencies.filter(c =>
    !search ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if(selecting) return (
    <View style={{flex:1,backgroundColor:C.bg}}>
      <StatusBar barStyle="light-content"/>
      <SafeAreaView style={{flex:1}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:20,paddingVertical:12}}>
          <TouchableOpacity onPress={()=>{setSelecting(null);setSearch('');}}>
            <Text style={{color:C.purple,fontSize:15,fontWeight:'600'}}>← Back</Text>
          </TouchableOpacity>
          <Text style={{color:C.text,fontSize:17,fontWeight:'700'}}>Select Currency</Text>
          <View style={{width:60}}/>
        </View>

        <ScrollView>
          {filtered.map(c=>(
            <TouchableOpacity
              key={c.code}
              style={{padding:14}}
              onPress={async ()=>{
                if(selecting==='from'){
                  setFromCurrency(c.code);
                  await AsyncStorage.setItem('fromCurrency', c.code);
                } else {
                  setToCurrency(c.code);
                  await AsyncStorage.setItem('toCurrency', c.code);
                }

                setSelecting(null);
                setSearch('');
                setResult(null);
              }}
            >
              <Text style={{color:C.text}}>{c.code} - {c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );

  return (
    <View style={{flex:1,backgroundColor:C.bg}}>
      <StatusBar barStyle="light-content"/>
      <SafeAreaView style={{flex:1}}>
        <ScrollView contentContainerStyle={{padding:16}}>

          <TouchableOpacity onPress={()=>setSelecting('from')}>
            <Text style={{color:C.text}}>From: {fromCurrency}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={()=>setSelecting('to')}>
            <Text style={{color:C.text}}>To: {toCurrency}</Text>
          </TouchableOpacity>

          <TextInput
            style={{color:C.text}}
            value={amount}
            onChangeText={v=>{
              setAmount(v);
              setResult(null);
            }}
          />

          <TouchableOpacity onPress={convert}>
            <Text style={{color:'#fff'}}>Convert</Text>
          </TouchableOpacity>

          {loading
            ? <ActivityIndicator color={C.purple}/>
            : <Text style={{color:C.teal}}>
                {result ? result.converted : '—'}
              </Text>
          }

          {/* ✅ POPULAR FIXED */}
          {POPULAR.map(code=>(
            <TouchableOpacity
              key={code}
              onPress={async ()=>{
                setFromCurrency(code);
                await AsyncStorage.setItem('fromCurrency', code);
                setResult(null);
              }}
            >
              <Text style={{color:C.text}}>{code}</Text>
            </TouchableOpacity>
          ))}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}