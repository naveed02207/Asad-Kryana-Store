const BASE_URL = 'https://api.sheety.co/1aca09256686540369a341fc8eb55d15/kryanaStore';

console.log("Connecting to Sheety API:", BASE_URL);

const fetchSheety = async (endpoint: string, method = 'GET', body?: any) => {
  const url = `${BASE_URL}${endpoint}`;
  const options: RequestInit = { 
    method,
    cache: 'no-store'
  };
  
  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Sheety API Error: ${res.status} ${errorText}`);
    }
    // DELETE doesn't usually return JSON
    if (method !== 'DELETE') {
      return await res.json();
    }
  } catch (error: any) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    throw error;
  }
};

export const api = {
  // Settings
  getSettings: async () => {
    const data = await fetchSheety('/settings');
    const settings: Record<string, string> = {};
    const rows = data.settings || data.setting || [];
    if (rows.length > 0) {
      rows.forEach((r: any) => {
        if (r.key && r.key !== 'admin_pin') {
          settings[r.key] = r.value;
        }
      });
    }
    return settings;
  },
  
  verifyPin: async (pin: string) => {
    const data = await fetchSheety('/settings');
    let adminPin = '1234';
    const rows = data.settings || data.setting || [];
    if (rows.length > 0) {
      const pinRow = rows.find((r: any) => r.key === 'admin_pin');
      if (pinRow) {
        adminPin = String(pinRow.value);
      }
    }
    if (String(pin) === adminPin) {
      return { success: true, token: 'admin_token' };
    }
    return { success: false, error: 'Invalid PIN' };
  },

  // Products (Inventory)
  getProducts: async () => {
    const data = await fetchSheety('/inventory');
    const rows = data.inventory || data.inventories || [];
    return rows.map((item: any) => ({
      ...item,
      id: String(item.id)
    }));
  },
  
  addProduct: async (product: any) => {
    const payload = { inventory: product };
    const data = await fetchSheety('/inventory', 'POST', payload);
    const item = data.inventory || data.inventories;
    return { ...item, id: String(item.id) };
  },
  
  updateProduct: async (id: string, product: any) => {
    const payload = { inventory: product };
    const data = await fetchSheety(`/inventory/${id}`, 'PUT', payload);
    const item = data.inventory || data.inventories;
    return { ...item, id: String(item.id) };
  },
  
  deleteProduct: async (id: string) => {
    await fetchSheety(`/inventory/${id}`, 'DELETE');
  },

  // Customers
  getCustomers: async () => {
    const data = await fetchSheety('/customers');
    const rows = data.customers || data.customer || [];
    return rows.map((c: any) => ({
      ...c,
      id: String(c.id),
      balance: Number(c.balance || 0)
    }));
  },
  
  addCustomer: async (customer: any) => {
    const payload = { customer: { ...customer, balance: 0 } };
    const data = await fetchSheety('/customers', 'POST', payload);
    const item = data.customer || data.customers;
    return { ...item, id: String(item.id) };
  },

  // Khata
  getKhata: async (customerId: string) => {
    const data = await fetchSheety('/khataTransactions');
    const rows = data.khataTransactions || data.khataTransaction || [];
    return rows
      .filter((t: any) => String(t.customerId) === String(customerId))
      .map((t: any) => ({
        ...t,
        id: String(t.id),
        amount: Number(t.amount)
      }))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  
  addKhataTransaction: async (data: any) => {
    const { customerId, amount, type, description, date } = data;
    
    // 1. Get customer to calculate new balance
    const custData = await fetchSheety(`/customers/${customerId}`);
    const customer = custData.customer || custData.customers;
    let currentBalance = Number(customer.balance || 0);
    const numAmount = Number(amount);
    
    if (type === 'payment') currentBalance -= numAmount;
    else if (type === 'credit') currentBalance += numAmount;
    
    // 2. Update customer balance
    await fetchSheety(`/customers/${customerId}`, 'PUT', { customer: { balance: currentBalance } });
    
    // 3. Add transaction
    const transPayload = {
      khataTransaction: {
        customerId: String(customerId),
        amount: numAmount,
        type,
        date: date || new Date().toISOString(),
        description
      }
    };
    const res = await fetchSheety('/khataTransactions', 'POST', transPayload);
    const trans = res.khataTransaction || res.khataTransactions;
    return {
      transaction: { ...trans, id: String(trans.id) },
      newBalance: currentBalance
    };
  },

  // Billing
  checkout: async (payload: any) => {
    const { items, total, customerId, customerName, paymentMethod, discount, amountPaid } = payload;
    
    // 1. Update inventory stock (Sequential due to API rate limits)
    for (const item of items) {
      try {
        const invData = await fetchSheety(`/inventory/${item.productId}`);
        const invItem = invData.inventory || invData.inventories;
        if (invItem) {
          const currentStock = Number(invItem.stock || 0);
          const newStock = Math.max(0, currentStock - item.quantity);
          await fetchSheety(`/inventory/${item.productId}`, 'PUT', { inventory: { stock: newStock } });
        }
      } catch (err) {
        console.error("Error updating stock for product:", item.productId, err);
      }
    }
    
    const dateStr = new Date().toISOString();
    
    // 2. Update Khata if needed
    if (paymentMethod === 'khata' && customerId) {
      const custData = await fetchSheety(`/customers/${customerId}`);
      const customer = custData?.customer || custData?.customers;
      if (customer) {
        let currentBalance = Number(customer.balance || 0);
        const advancePaid = Number(amountPaid || 0);
        const amountAddedToKhata = total - advancePaid;
        
        currentBalance += amountAddedToKhata;
        
        // Update balance
        await fetchSheety(`/customers/${customerId}`, 'PUT', { customer: { balance: currentBalance } });
        
        // Add Khata transaction
        await fetchSheety('/khataTransactions', 'POST', {
          khataTransaction: {
            id: Date.now().toString() + Math.floor(Math.random() * 1000),
            customerId: String(customerId),
            amount: amountAddedToKhata,
            type: 'credit',
            date: dateStr,
            description: `Bill Purchase ${advancePaid > 0 ? '(Partial Payment)' : ''}`
          }
        });
      }
    }
    
    // 3. Add Billing record
    const billPayload = {
      billing: {
        id: Date.now().toString(),
        customerId: customerId || "",
        customerName: customerName || "Walk-in",
        total: Number(total),
        discount: Number(discount || 0),
        paymentMethod,
        items: JSON.stringify(items),
        date: dateStr
      }
    };
    
    const res = await fetchSheety('/billing', 'POST', billPayload);
    const bill = res.billing || res.billings;
    return { success: true, bill: { ...bill, id: String(bill.id) } };
  },

  // Reports
  getReports: async (start?: string, end?: string) => {
    const data = await fetchSheety('/billing');
    const rows = data.billing || data.billings || [];
    let bills = rows.map((b: any) => {
      let parsedItems = [];
      try {
        parsedItems = typeof b.items === 'string' ? JSON.parse(b.items) : (b.items || []);
      } catch (e) {
        console.error("Error parsing items for bill:", b.id, e);
      }
      return {
        ...b,
        id: b.id ? String(b.id) : Date.now().toString() + Math.random().toString(36).substring(7),
        total: Number(b.total || 0),
        discount: Number(b.discount || 0),
        items: parsedItems,
        date: b.date || new Date().toISOString()
      };
    });
    
    if (start && end) {
      bills = bills.filter((b: any) => {
        try {
          const billDate = new Date(b.date);
          if (isNaN(billDate.getTime())) return false;
          
          const year = billDate.getFullYear();
          const month = String(billDate.getMonth() + 1).padStart(2, '0');
          const day = String(billDate.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;
          
          return dateString >= start && dateString <= end;
        } catch (err) {
          return false;
        }
      });
    }
    
    return bills;
  }
};
