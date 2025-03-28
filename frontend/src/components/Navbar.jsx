import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiLogOut, FiMenu, FiX, FiDatabase } from 'react-icons/fi';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/upload-dataset', label: 'Upload Dataset' },
    { path: '/data-repository', label: 'Data Repository' },
    { path: '/duplicates', label: 'Duplicates' },
    { path: '/records', label: 'Records' }
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                DDAS
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`${
                    isActive(path)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Profile and logout buttons */}
          {token ? (
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              <Link
                to="/profile"
                className={`${
                  isActive('/profile')
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                } px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2`}
              >
                <FiUser className="w-4 h-4" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                <FiLogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <Link
                to="/login"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <FiX className="block h-6 w-6" />
              ) : (
                <FiMenu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`${
                  isActive(path)
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-50'
                } block px-3 py-2 rounded-md text-base font-medium border-l-4`}
                onClick={() => setIsMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
          {token && (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="space-y-1">
                <Link
                  to="/profile"
                  className={`${
                    isActive('/profile')
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'text-gray-500 hover:bg-gray-50'
                  } block px-3 py-2 rounded-md text-base font-medium border-l-4 flex items-center gap-2`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiUser className="w-5 h-5" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-500 hover:bg-gray-50 block w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
                >
                  <FiLogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar; 