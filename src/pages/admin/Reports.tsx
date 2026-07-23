import React, { useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { FileDown, Calendar, Search } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';

export function Reports() {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchReports = async () => {
    if (!startDate || !endDate) return alert("Please select date range");
    
    setLoading(true);
    try {
      const start = startOfDay(new Date(startDate)).getTime();
      const end = endOfDay(new Date(endDate)).getTime();

      const q = query(
        collection(db, 'orders'),
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'desc')
      );

      const snap = await getDocs(q);
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setSearched(true);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      alert("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (orders.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Order ID,Items,Subtotal,Discount,Total,Payment Method\n";

    orders.forEach(order => {
      const dateStr = format(order.date, 'yyyy-MM-dd HH:mm');
      const itemsStr = order.items.map(i => `${i.name}(${i.quantity})`).join(" | ");
      csvContent += `"${dateStr}","${order.id}","${itemsStr}",${order.subtotal},${order.discount},${order.total},"${order.paymentMethod}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `asad_karyana_sales_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-slate-800">Sales Reports</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 shrink-0">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 max-w-xs">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" 
              />
            </div>
          </div>
          <div className="flex-1 max-w-xs">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" 
              />
            </div>
          </div>
          <button 
            onClick={fetchReports}
            disabled={loading}
            className="bg-emerald-600 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center h-[32px] disabled:opacity-50"
          >
            {loading ? 'Searching...' : <><Search className="w-3.5 h-3.5 mr-1.5" /> Search Data</>}
          </button>
        </div>
      </div>

      {searched && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Results: {orders.length} orders found</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Total Sales: <span className="font-bold text-emerald-600">Rs {totalSales}</span></p>
            </div>
            <button 
              onClick={handleDownloadCSV}
              disabled={orders.length === 0}
              className="flex items-center bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
              Download CSV
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold">Items</th>
                  <th className="px-4 py-3 font-bold text-right">Discount</th>
                  <th className="px-4 py-3 font-bold text-right">Total</th>
                  <th className="px-4 py-3 font-bold text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2 font-medium text-slate-600 whitespace-nowrap">{format(order.date, 'MMM dd, HH:mm')}</td>
                    <td className="px-4 py-2 text-slate-800 max-w-xs truncate">
                      {order.items.length > 2 
                        ? `${order.items[0].name}, ${order.items[1].name} + ${order.items.length - 2} more`
                        : order.items.map(i => i.name).join(', ')}
                    </td>
                    <td className="px-4 py-2 text-right text-red-500 font-medium">{order.discount > 0 ? `Rs ${order.discount}` : '-'}</td>
                    <td className="px-4 py-2 font-bold text-emerald-600 text-right">Rs {order.total}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${order.paymentMethod === 'cash' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                        {order.paymentMethod}
                      </span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">No sales found in this date range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
