import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { KhataTransaction, Customer } from '../../types';
import { Wallet, History } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export function CustomerKhata() {
  const [customerInfo, setCustomerInfo] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<KhataTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKhata = async () => {
      try {
        // Fetch first customer for demo since auth is removed
        const qCust = query(collection(db, 'customers'), limit(1));
        const snapCust = await getDocs(qCust);
        
        if (!snapCust.empty) {
          const custData = { id: snapCust.docs[0].id, ...snapCust.docs[0].data() } as Customer;
          setCustomerInfo(custData);
          
          const qTrans = query(
            collection(db, 'khata_transactions'),
            orderBy('date', 'desc')
          );
          const snapTrans = await getDocs(qTrans);
          
          // Filter by customerId manually since we don't have a composite index set up
          const filteredTrans = snapTrans.docs
            .map(d => ({ id: d.id, ...d.data() } as KhataTransaction))
            .filter(t => t.customerId === custData.id);
            
          setTransactions(filteredTrans);
        }
      } catch (error) {
        console.error("Error fetching khata", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchKhata();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!customerInfo) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center shadow-sm">
        <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">No Khata Account Found</h3>
        <p className="text-xs text-slate-500 mt-1">Please ask the store admin to create a Khata account matching your name.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="bg-slate-900 rounded-lg shadow-sm p-5 text-white flex justify-between items-center shrink-0 border border-slate-800">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Your Current Balance</p>
          <h2 className="text-2xl font-bold mt-1 flex items-center">
            Rs {customerInfo.balance}
            {customerInfo.balance > 0 && <span className="ml-3 text-[10px] bg-red-500/20 text-red-400 border border-red-500/50 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Due</span>}
            {customerInfo.balance < 0 && <span className="ml-3 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Advance</span>}
            {customerInfo.balance === 0 && <span className="ml-3 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Clear</span>}
          </h2>
        </div>
        <Wallet className="w-8 h-8 text-emerald-500 opacity-80" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-3 border-b border-slate-100 bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-800 text-sm flex items-center">
            <History className="w-4 h-4 mr-1.5 text-emerald-600" />
            Transaction History
          </h3>
        </div>
        <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
          {transactions.map(t => (
            <div key={t.id} className="p-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
              <div>
                <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1", t.type === 'payment' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200')}>
                  {t.type === 'payment' ? 'Payment' : 'Udhaar'}
                </span>
                <p className="text-xs font-bold text-slate-800">{t.description}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{format(t.date, 'PPP p')}</p>
              </div>
              <span className={cn("font-bold text-sm", t.type === 'payment' ? 'text-green-600' : 'text-red-600')}>
                {t.type === 'payment' ? '+' : '-'} Rs {t.amount}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No transactions yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
