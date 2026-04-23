import React, { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext();

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};

export const WalletProvider = ({ children }) => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [pendingCommission, setPendingCommission] = useState(0);

    useEffect(() => {
        // Load wallet data from localStorage
        const savedWallet = localStorage.getItem('kerjain_wallet');
        if (savedWallet) {
            const walletData = JSON.parse(savedWallet);
            setBalance(walletData.balance || 0);
            setTransactions(walletData.transactions || []);
            setPendingCommission(walletData.pendingCommission || 0);
        }
    }, []);

    const saveWalletData = (data) => {
        localStorage.setItem('kerjain_wallet', JSON.stringify(data));
    };

    const addTransaction = (transaction) => {
        const newTransaction = {
            id: Date.now().toString(),
            ...transaction,
            timestamp: new Date().toISOString()
        };

        const updatedTransactions = [newTransaction, ...transactions];
        setTransactions(updatedTransactions);

        // Update balance based on transaction type
        let newBalance = balance;
        if (transaction.type === 'credit') {
            newBalance += transaction.amount;
        } else if (transaction.type === 'debit') {
            newBalance -= transaction.amount;
        }

        setBalance(newBalance);

        saveWalletData({
            balance: newBalance,
            transactions: updatedTransactions,
            pendingCommission
        });
    };

    const addCommission = (amount) => {
        const newPendingCommission = pendingCommission + amount;
        setPendingCommission(newPendingCommission);

        saveWalletData({
            balance,
            transactions,
            pendingCommission: newPendingCommission
        });
    };

    const payCommission = () => {
        if (balance >= pendingCommission) {
            const newBalance = balance - pendingCommission;
            setBalance(newBalance);

            addTransaction({
                type: 'debit',
                amount: pendingCommission,
                description: 'Pembayaran Komisi Platform',
                category: 'commission'
            });

            setPendingCommission(0);

            saveWalletData({
                balance: newBalance,
                transactions,
                pendingCommission: 0
            });

            return true;
        }
        return false;
    };

    const value = {
        balance,
        transactions,
        pendingCommission,
        addTransaction,
        addCommission,
        payCommission
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};