import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import Layout from './components/Layout';
import Dashboard from "./pages/Dashboard";
import DataRepository from "./pages/DataRepository";
import UploadDataset from "./pages/UploadDataset";
import Duplicates from './pages/Duplicates';
import Records from './pages/Records';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Landing from './pages/Landing';
import PrivateRoute from './components/PrivateRoute';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import authService from './services/authService';
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

// Create router with future flags enabled
const router = createBrowserRouter([
  // Public Routes
  {
    path: "/",
    element: <Landing />
  },
  {
    path: "/signin",
    element: authService.isAuthenticated() ? <Navigate to="/dashboard" /> : <SignIn />
  },
  {
    path: "/signup",
    element: authService.isAuthenticated() ? <Navigate to="/dashboard" /> : <SignUp />
  },
  {
    path: "/verify-email",
    element: <VerifyEmail />
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />
  },
  {
    path: "/reset-password",
    element: <ResetPassword />
  },
  // Protected Routes
  {
    element: <PrivateRoute><Layout /></PrivateRoute>,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />
      },
      {
        path: "upload",
        element: <UploadDataset />
      },
      {
        path: "repository",
        element: <DataRepository />
      },
      {
        path: "duplicates",
        element: <Duplicates />
      },
      {
        path: "duplicates/:id",
        element: <Duplicates />
      },
      {
        path: "records",
        element: <Records />
      },
      {
        path: "settings",
        element: <Settings />
      },
      {
        path: "profile",
        element: <Profile />
      }
    ]
  },
  // Catch-all route
  {
    path: "*",
    element: authService.isAuthenticated() ? <Navigate to="/dashboard" /> : <Navigate to="/" />
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
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
}

export default App;
