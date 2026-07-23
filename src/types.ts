export type Role = 'admin' | 'customer';

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
  createdAt: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number; // positive = owes store, negative = store owes them
  createdAt: number;
}

export interface KhataTransaction {
  id: string;
  customerId: string;
  amount: number;
  type: 'credit' | 'payment';
  description: string;
  date: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  customerId: string | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  paymentMethod: 'cash' | 'khata';
  date: number;
}
