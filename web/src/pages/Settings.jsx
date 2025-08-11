import React from 'react';
import apiService from '../services/apiService';

const Settings = () => {
  const handleTestAuthFailure = () => {
    // This will simulate an authentication failure and redirect to login
    apiService.simulateAuthFailure();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings/Profile</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Test Authentication</h2>
        <p className="text-yellow-700 mb-4">
          Click the button below to test the authentication failure handling. 
          This will simulate a session termination and redirect you to the login page.
        </p>
        <button
          onClick={handleTestAuthFailure}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          Test Authentication Failure
        </button>
      </div>
    </div>
  );
};

export default Settings; 