import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Store, User, LogOut, Package, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';

export function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    navigate('/admin');
  };

  const navItems = [
    { name: 'My Dashboard', path: '/customer', icon: User },
    { name: 'Products', path: '/customer/products', icon: Package },
    { name: 'Khata Balance', path: '/customer/khata', icon: Wallet },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-slate-800 font-sans">
      <header className="bg-slate-900 border-b border-slate-800 text-white shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center">
              <Store className="h-5 w-5 text-emerald-400 mr-2" />
              <span className="font-bold text-lg text-white tracking-tight">ASAD <span className="font-light">KARYANA</span></span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider hidden sm:block">
                Welcome, Customer
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                title="Back to Admin"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/customer' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "inline-flex items-center pt-1 border-b-2 text-xs font-bold py-3 uppercase tracking-wider transition-colors",
                    isActive
                      ? "border-emerald-500 text-slate-900"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
