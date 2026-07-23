import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { startOfDay, endOfDay } from 'date-fns';
import { Order, Product } from '../../types';
import { TrendingUp, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const [todaySales, setTodaySales] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [topProducts, setTopProducts] = useState<{name: string, sold: number}[]>([]);
  const [salesData, setSalesData] = useState<{time: string, amount: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const start = startOfDay(today).getTime();
        const end = endOfDay(today).getTime();

        const q = query(
          collection(db, 'orders'),
          where('date', '>=', start),
          where('date', '<=', end)
        );

        const querySnapshot = await getDocs(q);
        const orders = querySnapshot.docs.map(doc => doc.data() as Order);

        let total = 0;
        const productCounts: Record<string, number> = {};
        const hourlySales: Record<string, number> = {};

        orders.forEach(order => {
          total += order.total;
          
          // Hourly formatting
          const hour = new Date(order.date).getHours();
          const timeLabel = `${hour}:00`;
          hourlySales[timeLabel] = (hourlySales[timeLabel] || 0) + order.total;

          order.items.forEach(item => {
            productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
          });
        });

        setTodaySales(total);
        setTodayOrders(orders.length);

        const top = Object.entries(productCounts)
          .map(([name, sold]) => ({ name, sold }))
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 10);
        
        setTopProducts(top);

        const chartData = Object.entries(hourlySales).map(([time, amount]) => ({ time, amount }));
        setSalesData(chartData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const downloadReport = () => {
    alert("Report downloading would generate a CSV of today's sales here.");
    // Implementation for CSV export
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-5 flex flex-col h-full overflow-hidden">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Today's Revenue</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">Rs {todaySales.toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 italic">Total {todayOrders} orders today</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Orders</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-600">{todayOrders}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-2">Processed today</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Order Value</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">
              Rs {todayOrders > 0 ? Math.round(todaySales / todayOrders).toLocaleString() : 0}
            </span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Top Products</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-orange-500">{topProducts.length}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-2">Active items sold</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-[480px]">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">Today's Sales Trend</h3>
            <button 
              onClick={downloadReport}
              className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-200"
            >
              Export Report
            </button>
          </div>
          <div className="flex-1 p-6 w-full">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `Rs ${val}`} tick={{fontSize: 10, fill: '#64748b'}} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', fontSize: '10px' }}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[2, 2, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No sales data for today yet.
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="col-span-1 flex flex-col space-y-5 h-full">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex-1 overflow-hidden flex flex-col">
            <h3 className="font-bold text-sm mb-3 border-b border-slate-100 pb-2 text-slate-800 flex items-center">
              Top Products <span className="text-xs font-normal text-slate-400 ml-2">(Today)</span>
            </h3>
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              {topProducts.length > 0 ? (
                topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-100">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-700 truncate">{product.name}</div>
                      <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                        <span>{product.sold} Units sold</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-4 text-xs">No products sold yet.</p>
              )}
            </div>
            <button className="w-full mt-4 py-2 border-2 border-dashed border-slate-200 text-slate-400 text-xs rounded hover:border-emerald-200 hover:text-emerald-500 transition-colors">
              View All Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
