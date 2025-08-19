import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('ClientDetails component mounted');
    console.log('Client ID from URL:', id);
    
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading client details...</p>
          <p className="text-sm text-gray-500 mt-2">Client ID: {id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client Details</h1>
              <p className="text-gray-600 mt-1">Client ID: {id}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/clients')}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Back to Clients
              </button>
            </div>
          </div>
        </div>

        {/* Test Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Content</h2>
          <p className="text-gray-600 mb-4">
            This is a test to see if the ClientDetails component is rendering properly.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Debug Information:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Component is rendering ✅</li>
              <li>• Client ID from URL: {id}</li>
              <li>• Current URL: {window.location.href}</li>
              <li>• Timestamp: {new Date().toLocaleString()}</li>
            </ul>
          </div>
        </div>

        {/* API Test Button */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Test</h2>
          <button
            onClick={async () => {
              try {
                console.log('Testing API call...');
                const response = await fetch(`http://localhost:5001/api/clients/${id}`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  }
                });
                const data = await response.json();
                console.log('API Response:', data);
                alert(`API Test Result: ${response.ok ? 'Success' : 'Failed'}\nCheck console for details.`);
              } catch (error) {
                console.error('API Test Error:', error);
                alert(`API Test Error: ${error.message}`);
              }
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Test API Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails; 