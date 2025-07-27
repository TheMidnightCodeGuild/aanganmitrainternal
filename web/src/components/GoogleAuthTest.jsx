import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import googleDriveService from '../services/googleDriveService';

const GoogleAuthTest = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isMockMode, setIsMockMode] = useState(false);

  const testGoogleAuth = async () => {
    try {
      setStatus('Testing Google OAuth...');
      setError('');
      
      // Test initialization
      await googleDriveService.initialize();
      setStatus('✅ Google API initialized successfully');
      
      // Test authentication
      const user = await googleDriveService.authenticate();
      setStatus(`✅ Authenticated as: ${user.getBasicProfile().getName()}`);
      
    } catch (err) {
      console.error('Google Auth Test Error:', err);
      setError(err.message || 'Authentication failed');
      setStatus('❌ Authentication failed');
    }
  };

  const toggleMockMode = () => {
    const newMode = !isMockMode;
    setIsMockMode(newMode);
    googleDriveService.setMockMode(newMode);
    setStatus(newMode ? '🔧 Mock mode enabled - File uploads will be simulated' : '🔧 Mock mode disabled - Real uploads will be used');
    setError('');
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Google OAuth Test
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={testGoogleAuth}
        >
          Test Google Authentication
        </Button>
        <Button 
          variant="outlined" 
          onClick={toggleMockMode}
          color={isMockMode ? "success" : "primary"}
        >
          {isMockMode ? "🔧 Mock Mode ON" : "🔧 Mock Mode OFF"}
        </Button>
      </Box>
      
      {status && (
        <Alert severity={status.includes('✅') ? 'success' : 'info'} sx={{ mb: 2 }}>
          {status}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="body2" color="text.secondary">
        This test will help verify if Google OAuth is properly configured for localhost.
      </Typography>
    </Box>
  );
};

export default GoogleAuthTest; 