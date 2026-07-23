import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types';
import { Search } from 'lucide-react';

export function CustomerProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      } catch (error) {
        console.error("Error fetching products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-slate-800">Available Products</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {filtered.length} Items Available
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map(product => (
              <div key={product.id} className="border border-slate-200 bg-slate-50 rounded p-3 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 truncate leading-tight">{product.name}</h3>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{product.category}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-end">
                  <div>
                    <p className="text-emerald-600 font-bold text-sm">Rs {product.price}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                    {product.unit}
                  </span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-400 text-xs">
                No products found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
