// src/routes/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { user, loading } = useAuth();

  // Optional: show a loading state while auth is being checked
  if (loading) {
    return <div>Loading...</div>;
  }

  // If logged in, render child routes; otherwise redirect to login
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;