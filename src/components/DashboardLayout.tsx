import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Users, Calendar, TestTube2, Settings, LogOut, Menu, X } from 'lucide-react';
import { setAuth, useAuth } from '../lib/auth';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigation = [
    { name: 'Interviews', href: '/interviews', icon: Users },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Tests', href: '/tests', icon: TestTube2 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    setAuth(null);
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">TechRecruit</h1>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div className="flex h-screen pt-14 lg:pt-0">
        {/* Sidebar for desktop */}
        <div className={`
          fixed inset-0 z-10 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          w-64 bg-white shadow-lg lg:block
        `}>
          <div className="h-full flex flex-col">
            <div className="hidden lg:flex h-16 items-center px-6">
              <h1 className="text-xl font-bold text-gray-900">TechRecruit</h1>
            </div>
            <div className="px-6 py-2 border-b">
              <p className="text-sm text-gray-600">Welcome,</p>
              <p className="font-medium text-gray-900">{user?.name}</p>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`${
                      location.pathname === item.href
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                  >
                    <Icon
                      className={`${
                        location.pathname === item.href
                          ? 'text-indigo-600'
                          : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 h-5 w-5`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t">
              <button 
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-gray-900"
              >
                <LogOut className="mr-2 h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </div>

        {/* Mobile menu backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-0 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}