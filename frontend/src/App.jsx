import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import Duplicates from './pages/Duplicates';
import Profile from './pages/Profile';
import UploadDataset from './pages/UploadDataset';
import Settings from './pages/Settings';
import { isAuthenticated } from './services/authService';

// Layout component for protected routes with navigation
const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation />
      <div className="flex-1 ml-64">
        <div className="p-8 h-full max-w-[1400px]">
          {children}
        </div>
      </div>
    </div>
  );
};

// Protected Route wrapper
const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/signin" replace />
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/upload-dataset"
          element={
            <PrivateRoute>
              <UploadDataset />
            </PrivateRoute>
          }
        />
        <Route
          path="/records"
          element={
            <PrivateRoute>
              <Records />
            </PrivateRoute>
          }
        />
        <Route
          path="/duplicates"
          element={
            <PrivateRoute>
              <Duplicates />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
