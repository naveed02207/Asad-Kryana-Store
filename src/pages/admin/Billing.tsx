import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Product, Customer, OrderItem } from '../../types';
import { Search, ShoppingCart, Plus, Minus, X, Printer, UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Billing() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'khata'>('cash');
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodData, custData, settingsData] = await Promise.all([
          api.getProducts(),
          api.getCustomers(),
          api.getSettings()
        ]);
        
        setProducts(prodData);
        setCustomers(custData);
        setSettings(settingsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ, total: newQ * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal - discount;

  // Sync amount paid with total if cash and not touched, for simplicity we just auto-fill
  useEffect(() => {
    if (paymentMethod === 'cash') {
      setAmountPaid(total);
    } else {
      setAmountPaid(0);
    }
  }, [total, paymentMethod]);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty");
    if (paymentMethod === 'khata' && !selectedCustomer) return alert("Select a customer for Khata payment");

    setProcessing(true);
    try {
      const orderData = {
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || 'Walk-in',
        items: cart,
        subtotal,
        discount,
        total,
        paidAmount: amountPaid,
        paymentMethod,
        date: new Date().toISOString()
      };

      await api.checkout(orderData);

      printReceipt(orderData, selectedCustomer);
      
      // Refresh inventory and customers to get latest stock and balances
      const [prodData, custData] = await Promise.all([
        api.getProducts(),
        api.getCustomers()
      ]);
      setProducts(prodData);
      setCustomers(custData);

      // Reset POS
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setPaymentMethod('cash');
      
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  const printReceipt = (orderData: any, customer: Customer | null) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Asad Karyana</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              padding: 10px; 
              max-width: 300px; 
              margin: 0 auto; 
              font-size: 12px;
              color: #000;
            }
            h2 { text-align: center; margin: 0 0 5px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
            p { text-align: center; margin: 0; font-size: 12px; line-height: 1.2; }
            .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; padding-bottom: 4px; border-bottom: 1px dashed #000; font-weight: normal; }
            td { padding: 4px 0; vertical-align: top; }
            .text-right { text-align: right; }
            .totals { margin-top: 8px; font-size: 12px; }
            .totals div { display: flex; justify-content: space-between; margin: 3px 0; }
            .bold { font-weight: bold; font-size: 14px; }
            .center { text-align: center; }
            .qr-container { text-align: center; margin-top: 15px; }
            .qr-img { width: 120px; height: 120px; margin: 0 auto; display: block; }
          </style>
        </head>
        <body>
          <h2>Asad Karyana Store</h2>
          <p>Main Market, Local Area</p>
          <p>Date: ${new Date(orderData.date).toLocaleString()}</p>
          ${customer ? `<p style="margin-top:4px;">Customer: <b>${customer.name}</b></p>` : ''}
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items.map((item: any) => `
                <tr>
                  <td>${item.name}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${item.price}</td>
                  <td class="text-right">${item.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="totals">
            <div><span>Subtotal:</span><span>Rs ${orderData.subtotal}</span></div>
            ${orderData.discount > 0 ? `<div><span>Discount:</span><span>- Rs ${orderData.discount}</span></div>` : ''}
            <div class="bold"><span>Total:</span><span>Rs ${orderData.total}</span></div>
            <div class="divider"></div>
            <div><span>Paid:</span><span>Rs ${orderData.paidAmount}</span></div>
            <div><span>Payment:</span><span style="text-transform: uppercase;">${orderData.paymentMethod}</span></div>
            ${orderData.paymentMethod === 'khata' && customer ? `
              <div class="divider"></div>
              <div><span>Previous Balance:</span><span>Rs ${customer.balance}</span></div>
              <div><span>Added to Khata:</span><span>Rs ${orderData.total - orderData.paidAmount}</span></div>
              <div class="bold"><span>New Balance:</span><span>Rs ${customer.balance + (orderData.total - orderData.paidAmount)}</span></div>
            ` : ''}
          </div>
          <div class="divider"></div>
          <p class="center" style="margin-bottom: 10px;">Thank you for shopping with us!</p>
          
          <div class="qr-container">
            <p style="font-weight: bold; margin-bottom: 5px;">Pay via QR Code</p>
            <img id="qrImage" class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`Bank: ${settings.bank_name || 'N/A'} | Title: ${settings.account_title || 'N/A'} | Acc/Raast: ${settings.account_number || 'N/A'} | Bill Amount: Rs. ${orderData.total}`)}" alt="Payment QR" />
            <div style="margin-top: 8px; font-size: 11px;">
              <p>Bank: <span style="font-weight:bold">${settings.bank_name || 'N/A'}</span></p>
              <p>Title: <span style="font-weight:bold">${settings.account_title || 'N/A'}</span></p>
              <p>Acc/Raast: <span style="font-weight:bold">${settings.account_number || 'N/A'}</span></p>
            </div>
          </div>
          <script>
            var img = document.getElementById('qrImage');
            function doPrint() {
              window.print();
            }
            if (img.complete) {
              doPrint();
            } else {
              img.onload = doPrint;
              img.onerror = doPrint;
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) return <div>Loading POS...</div>;

  return (
    <div className="flex h-full gap-4">
      {/* Products Section */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className="border border-slate-200 bg-slate-50 hover:bg-white rounded p-3 cursor-pointer hover:border-emerald-500 transition-all shadow-sm"
              >
                <h3 className="font-bold text-xs text-slate-800 truncate leading-tight">{product.name}</h3>
                <p className="text-emerald-600 font-bold text-sm mt-1">Rs {product.price}</p>
                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500">
                  <span className="uppercase tracking-wider">{product.category}</span>
                  <span>{product.stock} {product.unit}</span>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-400 text-xs">
                No products found. Add products in Inventory.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-80 bg-white rounded-lg border border-slate-200 flex flex-col shadow-sm shrink-0">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center">
            <ShoppingCart className="w-4 h-4 mr-1.5 text-slate-500" /> Current Order
          </h2>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{cart.length} ITEMS</span>
        </div>

        {/* Customer Selection */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer</label>
          <select 
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const cust = customers.find(c => c.id === e.target.value);
              setSelectedCustomer(cust || null);
            }}
            className="w-full border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Walk-in Customer (Cash only)</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
            ))}
          </select>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart className="w-8 h-8 mb-2 text-slate-200" />
              <p className="text-xs">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 shadow-sm">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="font-bold text-slate-800 truncate text-xs">{item.name}</h4>
                  <p className="text-emerald-600 text-xs font-bold mt-0.5">Rs {item.price}</p>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeFromCart(item.productId)} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Summary */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal</span>
            <span className="font-medium">Rs {subtotal}</span>
          </div>
          <div className="flex justify-between text-xs items-center">
            <span className="text-slate-600">Discount (Rs)</span>
            <input 
              type="number" 
              value={discount} 
              onChange={e => setDiscount(Number(e.target.value) || 0)}
              className="w-16 text-right p-1 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 text-xs"
              min="0"
            />
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-200 pt-2 mt-1">
            <span>Total</span>
            <span className="text-emerald-600">Rs {total}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={cn(
                "py-1.5 px-2 rounded text-xs font-bold border transition-colors",
                paymentMethod === 'cash' 
                  ? "bg-emerald-600 text-white border-emerald-600" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              Cash Payment
            </button>
            <button
              onClick={() => setPaymentMethod('khata')}
              className={cn(
                "py-1.5 px-2 rounded text-xs font-bold border transition-colors",
                paymentMethod === 'khata' 
                  ? "bg-slate-700 text-white border-slate-700" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              Khata (Udhaar)
            </button>
          </div>

          {paymentMethod === 'khata' && (
            <div className="flex justify-between text-xs items-center pt-2">
              <span className="text-slate-600">Advance Paid (Rs)</span>
              <input 
                type="number" 
                value={amountPaid} 
                onChange={e => setAmountPaid(Number(e.target.value) || 0)}
                className="w-20 text-right p-1 border border-slate-200 rounded focus:ring-1 focus:ring-slate-500 text-xs"
                min="0"
              />
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing}
            className="w-full mt-3 flex items-center justify-center py-2 px-4 border border-transparent rounded shadow-sm text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : (
              <>
                <Printer className="w-4 h-4 mr-1.5" />
                Checkout & Print
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
