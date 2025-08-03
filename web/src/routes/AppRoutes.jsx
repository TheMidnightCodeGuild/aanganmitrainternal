import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const AppRoutes = () => {
  // HomeRedirect is now INSIDE the AuthProvider context
  const HomeRedirect = () => {
    const { user } = useAuth();
    return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>
          {/* <Route element={<PrivateRoute />}> */}
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
          {/* </Route> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default AppRoutes;