/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { CustomerLayout } from './components/CustomerLayout';

// Admin Pages
import { Dashboard } from './pages/admin/Dashboard';
import { Billing } from './pages/admin/Billing';
import { Inventory } from './pages/admin/Inventory';
import { Customers } from './pages/admin/Customers';
import { Reports } from './pages/admin/Reports';

// Customer Pages
import { CustomerProducts } from './pages/customer/Products';
import { CustomerKhata } from './pages/customer/Khata';

function AppRoutes() {
  return (
    <Routes>
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="billing" element={<Billing />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="customers" element={<Customers />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Customer Routes */}
      <Route path="/customer" element={<CustomerLayout />}>
        <Route index element={<Navigate to="products" replace />} />
        <Route path="products" element={<CustomerProducts />} />
        <Route path="khata" element={<CustomerKhata />} />
      </Route>

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

