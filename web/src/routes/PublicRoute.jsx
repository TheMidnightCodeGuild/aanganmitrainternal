// src/routes/PublicRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return !user ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default PublicRoute;