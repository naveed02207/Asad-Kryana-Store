import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Customer, KhataTransaction } from '../../types';
import { Plus, Search, User, Wallet, History } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({ name: '', phone: '', address: '' });

  const [isKhataModalOpen, setIsKhataModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [khataAmount, setKhataAmount] = useState('');
  const [khataType, setKhataType] = useState<'credit' | 'payment'>('payment');
  
  const [transactions, setTransactions] = useState<KhataTransaction[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const snap = await getDocs(collection(db, 'customers'));
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
    } catch (error) {
      console.error("Error fetching customers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'customers'), {
        ...customerFormData,
        balance: 0,
        createdAt: Date.now()
      });
      setIsCustomerModalOpen(false);
      setCustomerFormData({ name: '', phone: '', address: '' });
      fetchCustomers();
    } catch (error) {
      alert("Failed to add customer");
    }
  };

  const handleKhataTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amount = Number(khataAmount);
    if (amount <= 0) return alert("Amount must be greater than 0");

    try {
      const newBalance = khataType === 'credit' 
        ? selectedCustomer.balance + amount 
        : selectedCustomer.balance - amount;

      await updateDoc(doc(db, 'customers', selectedCustomer.id), {
        balance: newBalance
      });

      await addDoc(collection(db, 'khata_transactions'), {
        customerId: selectedCustomer.id,
        amount,
        type: khataType,
        description: khataType === 'payment' ? 'Payment Received' : 'Udhaar Added',
        date: Date.now()
      });

      setIsKhataModalOpen(false);
      setKhataAmount('');
      fetchCustomers();
    } catch (error) {
      alert("Transaction failed");
    }
  };

  const viewHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    try {
      const q = query(
        collection(db, 'khata_transactions'), 
        where('customerId', '==', customer.id),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as KhataTransaction)));
      setIsHistoryOpen(true);
    } catch (error) {
      alert("Failed to fetch history");
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  if (loading) return <div>Loading customers...</div>;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-slate-800">Customers & Khata</h2>
        <button 
          onClick={() => setIsCustomerModalOpen(true)}
          className="flex items-center bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex space-x-4 bg-slate-50">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="px-4 py-3 font-bold">Customer Info</th>
                <th className="px-4 py-3 font-bold text-right">Khata Balance</th>
                <th className="px-4 py-3 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(customer => (
                <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-full mr-3 border border-emerald-200 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{customer.name}</p>
                        <p className="text-[10px] text-slate-500">{customer.phone} | {customer.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex flex-col items-end">
                      <span className={cn("text-sm font-bold", customer.balance > 0 ? "text-red-600" : customer.balance < 0 ? "text-emerald-600" : "text-slate-600")}>
                        {customer.balance > 0 ? `Owes Rs ${customer.balance}` : customer.balance < 0 ? `Advance Rs ${Math.abs(customer.balance)}` : "Clear"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setKhataType('payment');
                          setIsKhataModalOpen(true);
                        }}
                        className="flex items-center px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-bold hover:bg-blue-100 transition-colors"
                      >
                        <Wallet className="w-3.5 h-3.5 mr-1" /> Clear Dues
                      </button>
                      <button 
                        onClick={() => viewHistory(customer)}
                        className="flex items-center px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold hover:bg-slate-200 transition-colors"
                      >
                        <History className="w-3.5 h-3.5 mr-1" /> History
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400 text-xs">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Add New Customer</h3>
            </div>
            <form onSubmit={handleAddCustomer} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                <input required type="text" value={customerFormData.name} onChange={e => setCustomerFormData({...customerFormData, name: e.target.value})} className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
                <input required type="tel" value={customerFormData.phone} onChange={e => setCustomerFormData({...customerFormData, phone: e.target.value})} className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Address</label>
                <input required type="text" value={customerFormData.address} onChange={e => setCustomerFormData({...customerFormData, address: e.target.value})} className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="px-3 py-1.5 rounded text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="px-3 py-1.5 rounded text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Clear Khata Modal */}
      {isKhataModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Manage Khata - {selectedCustomer.name}</h3>
              <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Current Balance: Rs {selectedCustomer.balance}</p>
            </div>
            <form onSubmit={handleKhataTransaction} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Transaction Type</label>
                <select value={khataType} onChange={(e: any) => setKhataType(e.target.value)} className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="payment">Payment Received (Clear Dues)</option>
                  <option value="credit">Add Udhaar (Credit)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (Rs)</label>
                <input required type="number" min="1" value={khataAmount} onChange={e => setKhataAmount(e.target.value)} className="block w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsKhataModalOpen(false)} className="px-3 py-1.5 rounded text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="px-3 py-1.5 rounded text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm">Confirm Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Drawer/Modal */}
      {isHistoryOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 flex justify-end z-50">
          <div className="bg-white w-full max-w-sm h-full flex flex-col shadow-xl">
            <div className="p-4 border-b border-emerald-700 flex justify-between items-center bg-emerald-600 text-white shrink-0">
              <div>
                <h3 className="font-bold text-sm">{selectedCustomer.name}'s Khata</h3>
                <p className="text-[10px] uppercase tracking-wider font-semibold opacity-90 mt-0.5">Balance: Rs {selectedCustomer.balance}</p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-1 hover:bg-emerald-700 rounded transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
              {transactions.map(t => (
                <div key={t.id} className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1", t.type === 'payment' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                        {t.type === 'payment' ? 'Payment' : 'Udhaar'}
                      </span>
                      <p className="text-xs font-bold text-slate-700">{t.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{format(t.date, 'PPpp')}</p>
                    </div>
                    <span className={cn("font-bold text-sm", t.type === 'payment' ? 'text-green-600' : 'text-red-600')}>
                      {t.type === 'payment' ? '+' : '-'} Rs {t.amount}
                    </span>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                  No khata transactions found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
