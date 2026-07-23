import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Store, LayoutDashboard, Package, Users, FileText, LogOut, Banknote } from 'lucide-react';
import { cn } from '../lib/utils';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    // Just a placeholder since no auth is used anymore
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
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-white font-semibold text-xs">Admin</span>
              <span>Store Owner</span>
            </div>
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
