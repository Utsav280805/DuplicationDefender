import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { FileText, Home, Database, Search, Settings, Upload, LogOut, Bell, User, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { toast } from './ui/use-toast';

const Layout = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const notifications = [
    { 
      id: 1, 
      message: 'New duplicate found in dataset', 
      time: '2 minutes ago',
      type: 'warning',
      icon: AlertTriangle,
      color: 'text-yellow-500'
    },
    { 
      id: 2, 
      message: 'Dataset upload completed', 
      time: '1 hour ago',
      type: 'success',
      icon: CheckCircle,
      color: 'text-green-500'
    },
    { 
      id: 3, 
      message: 'System update available', 
      time: '2 hours ago',
      type: 'info',
      icon: Info,
      color: 'text-blue-500'
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/signin');
      return;
    }
    
    setUser(JSON.parse(userData));
  }, [navigate]);

  if (!localStorage.getItem('token')) {
    return <Navigate to="/signin" />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
    toast({
      title: "Success",
      description: "Logged out successfully",
      duration: 3000,
    });
  };

  const navItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Upload className="w-5 h-5" />, label: 'Upload Dataset', path: '/upload' },
    { icon: <Database className="w-5 h-5" />, label: 'Data Repository', path: '/repository' },
    { icon: <Search className="w-5 h-5" />, label: 'Duplicates', path: '/duplicates' },
    { icon: <FileText className="w-5 h-5" />, label: 'Records', path: '/records' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/settings' },
  ];

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-blue-600">DDAS</h1>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-end gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full hover:bg-gray-100 relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[11px] text-white flex items-center justify-center font-medium">
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="notifications-container absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Notifications</h3>
                  <span className="text-sm text-gray-500">{notifications.length} new</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => {
                      const Icon = notification.icon;
                      return (
                        <div
                          key={notification.id}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors flex items-start gap-3"
                        >
                          <div className={`mt-1 ${notification.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500">
                      No new notifications
                    </div>
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user?.name || 'User'}
              </span>
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <NavLink
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Your Profile</span>
                </NavLink>
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
