'use client';

import React, { useState, useEffect } from 'react';
import { X, CreditCard, Building, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DepositTransaction {
  id: string;
  amount: number;
  method: string;
  date: string;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [transactions, setTransactions] = useState<DepositTransaction[]>([]);

  // Load previous deposits when modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        // Load total deposits
        const savedDeposits = localStorage.getItem('deposits');
        if (savedDeposits) {
          setTotalDeposits(parseFloat(savedDeposits));
        }
        
        // Load transaction history
        const savedTransactions = localStorage.getItem('depositTransactions');
        if (savedTransactions) {
          setTransactions(JSON.parse(savedTransactions));
        }
      } catch (err) {
        console.error('Error loading deposits from localStorage:', err);
      }
    }
  }, [isOpen]);

  // Quick deposit amounts
  const quickAmounts = [100, 500, 1000, 5000];

  // Payment methods
  const paymentMethods = [
    { id: 'bank', name: 'Bank Transfer', icon: Building, description: 'Transfer directly from your bank (1-3 business days)' },
    { id: 'card', name: 'Credit Card', icon: CreditCard, description: 'Instant deposit with 1.5% fee' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !paymentMethod) return;

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) return;

    setIsProcessing(true);
    
    // Create new transaction
    const newTransaction: DepositTransaction = {
      id: Date.now().toString(),
      amount: depositAmount,
      method: paymentMethod === 'bank' ? 'Bank Transfer' : 'Credit Card',
      date: new Date().toISOString()
    };
    
    // Simulate processing delay
    setTimeout(() => {
      try {
        // Update total deposits
        const newTotal = totalDeposits + depositAmount;
        localStorage.setItem('deposits', newTotal.toString());
        setTotalDeposits(newTotal);
        
        // Update transaction history
        const updatedTransactions = [...transactions, newTransaction];
        localStorage.setItem('depositTransactions', JSON.stringify(updatedTransactions));
        setTransactions(updatedTransactions);
        
        setIsProcessing(false);
        setIsSuccess(true);
        
        // Reset and close after showing success
        setTimeout(() => {
          resetForm();
        }, 2000);
      } catch (err) {
        console.error('Error saving deposit:', err);
        setIsProcessing(false);
        // Could add error handling UI here
      }
    }, 1500);
  };

  const resetForm = () => {
    setAmount('');
    setPaymentMethod('bank');
    setIsSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative bg-black border border-green-500 rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-green-500 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Deposit Funds</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-16 w-16 rounded-full bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Deposit Successful</h3>
              <p className="text-gray-400 text-center mb-2">
                Your deposit of ${parseFloat(amount).toLocaleString()} is being processed
              </p>
              <p className="text-gray-400 text-center mb-6">
                Total deposits: ${totalDeposits.toLocaleString()}
              </p>
              <button
                onClick={resetForm}
                className="px-6 py-2 bg-green-500 text-black font-medium rounded-lg hover:bg-green-600"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Current total */}
              {totalDeposits > 0 && (
                <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-300">Total deposits so far</p>
                  <p className="text-lg font-medium text-white">${totalDeposits.toLocaleString()}</p>
                </div>
              )}
              
              {/* Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount to Deposit
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    className="w-full pl-10 p-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    step="1"
                    required
                  />
                </div>
                
                {/* Quick amounts */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      className="px-3 py-1 text-xs font-medium rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700"
                      onClick={() => setAmount(quickAmount.toString())}
                    >
                      ${quickAmount}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method
                </label>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === method.id
                          ? 'bg-gray-800 border-green-500'
                          : 'border-gray-700 hover:bg-gray-800'
                      }`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        paymentMethod === method.id
                          ? 'bg-gray-700'
                          : 'bg-gray-800'
                      }`}>
                        <method.icon size={20} className={paymentMethod === method.id ? 'text-green-500' : 'text-gray-400'} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {method.name}
                          {paymentMethod === method.id && (
                            <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {method.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Submit */}
              <button
                type="submit"
                disabled={isProcessing || !amount || !paymentMethod}
                className={`w-full px-4 py-3 font-medium rounded-lg flex items-center justify-center ${
                  isProcessing || !amount || !paymentMethod
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-green-500 text-black hover:bg-green-600'
                }`}
              >
                {isProcessing ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    {amount && paymentMethod ? `Deposit $${parseFloat(amount).toLocaleString()}` : 'Deposit'}
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositModal;