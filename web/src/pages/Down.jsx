import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Down = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      // Try to reach the backend health endpoint
      const response = await fetch('http://localhost:5001/api/health', {
        method: 'GET',
        timeout: 3000
      });
      
      if (response.ok) {
        // Backend is back up, reload the page
        window.location.reload();
      } else {
        throw new Error('Backend still down');
      }
    } catch (error) {
      // Backend is still down, show a message
      alert('Our servers are still undergoing maintenance. Please check back later.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            We're currently down for maintenance
          </h1>
          <p className="text-gray-600 mb-4">
            Our servers are undergoing maintenance. Please check back later.
          </p>
          <p className="text-sm text-gray-500">
            Estimated downtime: 30 minutes
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking ? 'Checking...' : 'Check Status'}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default Down;
```

```
