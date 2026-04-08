import React, { createContext, useContext, useState, useEffect } from 'react';
import { initDatabase, getTransactions, addTransaction, getWallets, getCategories, seedDefaultData } from '../services/database';

const ExpenseContext = createContext({});

export const ExpenseProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await initDatabase();
    await seedDefaultData();
    await refreshData();
    setLoading(false);
  };

  const refreshData = async () => {
    const [transactionsData, walletsData, categoriesData] = await Promise.all([
      getTransactions(),
      getWallets(),
      getCategories()
    ]);
    setTransactions(transactionsData);
    setWallets(walletsData);
    setCategories(categoriesData);
  };

  const addNewTransaction = async (transaction) => {
    await addTransaction(transaction);
    await refreshData();
  };

  return (
    <ExpenseContext.Provider value={{
      transactions, wallets, categories, loading,
      addTransaction: addNewTransaction, refreshData
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => useContext(ExpenseContext);