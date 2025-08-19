import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Dashboard from '../pages/Dashboard';
import Properties from '../pages/Properties';
import PropertyDetails from '../pages/PropertyDetails';
import Clients from '../pages/Clients';
import ClientDetails from '../pages/ClientDetails';
import Tasks from '../pages/Tasks';
import Chat from '../pages/Chat';
import OpenList from '../pages/OpenList';
import Settings from '../pages/Settings';
import AppLayout from '../layouts/AppLayout';
import { AuthProvider, useAuth } from '../context/AuthContext';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import AddProperty from '../pages/AddProperty';
import AddClient from '../pages/AddClient';
import apiService from '../services/apiService';

// Debug component to track route changes
const RouteDebugger = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('Route changed to:', location.pathname);
  }, [location]);
  
  return null;
};

// Component to connect API service with auth context
const AuthConnector = ({ children }) => {
  const { handleAuthFailure } = useAuth();

  useEffect(() => {
    // Connect the API service auth failure callback
    apiService.setAuthFailureCallback(handleAuthFailure);
  }, [handleAuthFailure]);

  return children;
};

const AppRoutes = () => {
  // HomeRedirect is now INSIDE the AuthProvider context
  const HomeRedirect = () => {
    const { user, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
  };

  return (
    <AuthProvider>
      <AuthConnector>
        <Router>
          <RouteDebugger />
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>
            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/properties/add" element={<AddProperty />} />
                <Route path="/properties/:id" element={<PropertyDetails />} />
                <Route path="/properties/edit/:id" element={<AddProperty />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/add" element={<AddClient />} />
                <Route path="/clients/:id" element={<ClientDetails />} />
                <Route path="/clients/edit/:id" element={<AddClient />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/open" element={<OpenList />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthConnector>
    </AuthProvider>
  );
};

export default AppRoutes;