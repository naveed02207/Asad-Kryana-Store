import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Store, LayoutDashboard, Package, Users, FileText, LogOut, Banknote, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token === 'admin_token_123') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.verifyPin(pin);
      if (res.success) {
        localStorage.setItem('admin_token', res.token);
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    navigate('/admin');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Billing (POS)', path: '/admin/billing', icon: Store },
    { name: 'Inventory', path: '/admin/inventory', icon: Package },
    { name: 'Customers & Khata', path: '/admin/customers', icon: Users },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Customer View', path: '/customer', icon: Users },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Enter your PIN to access the dashboard
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-slate-700">
                  PIN Code
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <input
                    id="pin"
                    name="pin"
                    type="password"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2 border"
                    placeholder="Enter PIN"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-tight text-emerald-400">
            ASAD <span className="text-white font-light">KARYANA</span>
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Management Suite v2.0</p>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase font-semibold text-slate-500 px-3 mb-2 mt-2">Main Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path) && item.path !== '/customer');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 p-2.5 rounded text-sm transition-colors",
                  isActive 
                    ? "bg-emerald-600 text-white shadow-sm" 
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                <Icon className={cn(
                  "flex-shrink-0 h-5 w-5",
                  isActive ? "opacity-80" : "opacity-60"
                )} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="flex justify-between items-center cursor-pointer hover:text-white" onClick={handleLogout}>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-xs">Admin</span>
              <span>Logout</span>
            </div>
            <LogOut className="w-4 h-4" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center space-x-4 text-sm font-medium text-slate-700">
             {/* Header breadcrumb or simple date can go here */}
             Asad Karyana Control Panel
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold">Admin</span>
              <span className="text-[10px] text-slate-500 uppercase">Administrator</span>
            </div>
            <div className="w-9 h-9 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-full flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
