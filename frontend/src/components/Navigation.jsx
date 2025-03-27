import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from '../services/authService';
import { FiHome, FiUpload, FiDatabase, FiCopy, FiUser, FiLogOut } from 'react-icons/fi';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    signOut(navigate);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 min-h-screen bg-white border-r">
      {/* Logo */}
      <div className="px-6 py-4 border-b">
        <Link to="/" className="text-blue-600 text-xl">
          DDAS
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="px-6 py-4">
        <Link
          to="/dashboard"
          className={`flex items-center px-3 py-2 mb-1 ${
            isActive('/dashboard') ? 'text-blue-600 bg-blue-50 rounded' : 'text-gray-600'
          }`}
        >
          <FiHome className="mr-3" />
          Dashboard
        </Link>

        <Link
          to="/upload-dataset"
          className={`flex items-center px-3 py-2 mb-1 ${
            isActive('/upload-dataset') ? 'text-blue-600 bg-blue-50 rounded' : 'text-gray-600'
          }`}
        >
          <FiUpload className="mr-3" />
          Upload Dataset
        </Link>

        <Link
          to="/data-repository"
          className={`flex items-center px-3 py-2 mb-1 ${
            isActive('/data-repository') ? 'text-blue-600 bg-blue-50 rounded' : 'text-gray-600'
          }`}
        >
          <FiDatabase className="mr-3" />
          Data Repository
        </Link>

        <Link
          to="/duplicates"
          className={`flex items-center px-3 py-2 mb-1 ${
            isActive('/duplicates') ? 'text-blue-600 bg-blue-50 rounded' : 'text-gray-600'
          }`}
        >
          <FiCopy className="mr-3" />
          Duplicates
        </Link>

        <Link
          to="/records"
          className={`flex items-center px-3 py-2 mb-1 ${
            isActive('/records') ? 'text-blue-600 bg-blue-50 rounded' : 'text-gray-600'
          }`}
        >
          <FiDatabase className="mr-3" />
          Records
        </Link>

        <Link
          to="/settings"
          className={`flex items-center px-3 py-2 mb-1 ${
            isActive('/settings') ? 'text-blue-600 bg-blue-50 rounded' : 'text-gray-600'
          }`}
        >
          <FiUser className="mr-3" />
          Settings
        </Link>
      </div>

      {/* Bottom Links */}
      <div className="absolute bottom-0 w-full border-t">
        <Link
          to="/profile"
          className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50"
        >
          <FiUser className="mr-3" />
          Profile
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center px-6 py-3 w-full text-gray-600 hover:bg-gray-50"
        >
          <FiLogOut className="mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navigation; 