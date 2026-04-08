import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { database } from '../services/database';
import ExchangeRate from '../services/database/models/ExchangeRate';

const POPULAR_CURRENCIES = ['USD', 'EUR', 'GBP', 'UGX', 'KES', 'NGN', 'ZAR', 'JPY', 'INR', 'CAD', 'AUD'];

// Fallback rates (used only if database is empty)
const DEFAULT_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, UGX: 3800, KES: 130,
  NGN: 1500, ZAR: 18.5, JPY: 150, INR: 83, CAD: 1.37, AUD: 1.52
};

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('UGX');
  const [result, setResult] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [loading, setLoading] = useState(true);

  // Load rates from database
  useEffect(() => {
    loadRatesFromDatabase();
  }, []);

  const loadRatesFromDatabase = async () => {
    try {
      const rates = await database.get<ExchangeRate>('exchange_rates').query().fetch();
      
      if (rates.length > 0) {
        const ratesMap: Record<string, number> = { USD: 1 };
        rates.forEach(rate => {
          if (rate.fromCurrency === 'USD') {
            ratesMap[rate.toCurrency] = rate.rate;
          }
        });
        setExchangeRates(ratesMap);
      } else {
        // Seed default rates
        await seedDefaultRates();
      }
    } catch (error) {
      console.log('Error loading rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultRates = async () => {
    await database.write(async () => {
      for (const [currency, rate] of Object.entries(DEFAULT_RATES)) {
        if (currency !== 'USD') {
          await database.get<ExchangeRate>('exchange_rates').create(record => {
            record.fromCurrency = 'USD';
            record.toCurrency = currency;
            record.rate = rate;
            record.lastUpdated = Date.now();
          });
        }
      }
    });
    setExchangeRates(DEFAULT_RATES);
  };

  const convert = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;
    const converted = (numAmount / fromRate) * toRate;
    setResult(converted);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0c29', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f0c29', padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 30, textAlign: 'center' }}>
        Currency Converter
      </Text>
      
      <Text style={{ color: '#ccc', marginBottom: 5 }}>Amount</Text>
      <TextInput
        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', padding: 15, borderRadius: 12, fontSize: 18, marginBottom: 20 }}
        placeholder="0.00"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#ccc', marginBottom: 5 }}>From</Text>
          <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>{fromCurrency}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={swapCurrencies} style={{ marginHorizontal: 15, marginTop: 20 }}>
          <Text style={{ color: '#6C63FF', fontSize: 24 }}>⇄</Text>
        </TouchableOpacity>
        
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#ccc', marginBottom: 5 }}>To</Text>
          <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>{toCurrency}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={convert}
        style={{ backgroundColor: '#6C63FF', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 }}
      >
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Convert</Text>
      </TouchableOpacity>

      {result !== null && (
        <View style={{ backgroundColor: 'rgba(108,99,255,0.2)', padding: 20, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#ccc', fontSize: 14 }}>Converted Amount</Text>
          <Text style={{ color: '#6C63FF', fontSize: 32, fontWeight: 'bold', marginTop: 5 }}>
            {result.toFixed(2)} {toCurrency}
          </Text>
        </View>
      )}
      
      <Text style={{ color: '#666', fontSize: 12, textAlign: 'center', marginTop: 30 }}>
        💡 Offline mode - Using saved exchange rates
      </Text>
    </ScrollView>
  );
}