import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowBack, Save, Person, Visibility, Email, Phone } from '@mui/icons-material';
import apiService from '../services/apiService';

const AddClient = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState({});
  const [client, setClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    type: 'individual',
    leadSource: 'other',
    preferences: {
      propertyTypes: [],
      cities: [],
      budget: { min: '', max: '' },
      area: { min: '', max: '' }
    },
    notes: ''
  });

  // Load client data if editing
  useEffect(() => {
    if (isEditing) {
      loadClient();
    }
  }, [id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const response = await apiService.getClient(id);
      
      // Ensure preferences object exists with all required properties
      const clientData = response.client;
      const preferences = clientData.preferences || {};
      
      setClient({
        name: clientData.name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        address: clientData.address || '',
        type: clientData.type || 'individual',
        leadSource: clientData.leadSource || 'other',
        preferences: {
          propertyTypes: preferences.propertyTypes || [],
          cities: preferences.cities || [],
          budget: {
            min: preferences.budget?.min || '',
            max: preferences.budget?.max || ''
          },
          area: {
            min: preferences.area?.min || '',
            max: preferences.area?.max || ''
          }
        },
        notes: clientData.notes || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setClient(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setClient(prev => ({ ...prev, [field]: value }));
    }

    // Clear validation errors and duplicate info when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (duplicateInfo[field]) {
      setDuplicateInfo(prev => ({ ...prev, [field]: null }));
    }

    // Check for duplicates on email and phone changes
    if (field === 'email' || field === 'phone') {
      checkDuplicates(field, value);
    }
  };

  const checkDuplicates = async (field, value) => {
    if (!value || value.length < 3) return; // Don't check if value is too short

    try {
      setCheckingDuplicates(true);
      const email = field === 'email' ? value : client.email;
      const phone = field === 'phone' ? value : client.phone;
      
      const response = await apiService.checkClientDuplicates(email, phone, isEditing ? id : null);
      
      if (response.duplicates) {
        const newErrors = { ...validationErrors };
        const newDuplicateInfo = { ...duplicateInfo };
        
        if (response.duplicates.email?.exists) {
          newErrors.email = `A client with this email already exists`;
          newDuplicateInfo.email = response.duplicates.email;
        } else {
          newDuplicateInfo.email = null;
        }
        
        if (response.duplicates.phone?.exists) {
          newErrors.phone = `A client with this phone number already exists`;
          newDuplicateInfo.phone = response.duplicates.phone;
        } else {
          newDuplicateInfo.phone = null;
        }
        
        setValidationErrors(newErrors);
        setDuplicateInfo(newDuplicateInfo);
      } else {
        // Clear duplicate info if no duplicates found
        setDuplicateInfo(prev => ({
          ...prev,
          [field]: null
        }));
      }
    } catch (err) {
      console.error('Error checking duplicates:', err);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handlePreferenceChange = (type, value) => {
    setClient(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: value
      }
    }));
  };

  const handlePropertyTypeChange = (propertyType) => {
    setClient(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        propertyTypes: prev.preferences.propertyTypes.includes(propertyType)
          ? prev.preferences.propertyTypes.filter(type => type !== propertyType)
          : [...prev.preferences.propertyTypes, propertyType]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors({});

    // Final duplicate check before submission
    try {
      const response = await apiService.checkClientDuplicates(client.email, client.phone, isEditing ? id : null);
      
      if (response.hasDuplicates) {
        const newErrors = {};
        const newDuplicateInfo = {};
        if (response.duplicates.email?.exists) {
          newErrors.email = `A client with this email already exists`;
          newDuplicateInfo.email = response.duplicates.email;
        }
        if (response.duplicates.phone?.exists) {
          newErrors.phone = `A client with this phone number already exists`;
          newDuplicateInfo.phone = response.duplicates.phone;
        }
        setValidationErrors(newErrors);
        setDuplicateInfo(newDuplicateInfo);
        setLoading(false);
        return;
      }

      if (isEditing) {
        await apiService.updateClient(id, client);
      } else {
        await apiService.createClient(client);
      }
      navigate('/clients');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = [
    'Apartment', 'House', 'Villa', 'Office', 'Shop', 'Warehouse', 'Land'
  ];

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowBack className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Buyer' : 'Add New Buyer'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEditing ? 'Update buyer information' : 'Create a new buyer profile'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-400">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6 flex items-center">
              <Person className="w-5 h-5 mr-2 text-blue-600" />
              Buyer Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={client.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={client.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      validationErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {checkingDuplicates && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                )}
                {/* Duplicate Info Box for Email */}
                {duplicateInfo.email && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Email className="w-4 h-4 text-amber-600 mr-2" />
                          <h4 className="text-sm font-medium text-amber-800">
                            Existing Client Found
                          </h4>
                        </div>
                        <p className="mt-1 text-sm text-amber-700">
                          <strong>{duplicateInfo.email.clientName}</strong> already has this email address.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/clients/${duplicateInfo.email.clientId}`)}
                        className="ml-3 inline-flex items-center px-2.5 py-1.5 border border-amber-300 shadow-sm text-xs font-medium rounded text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                      >
                        <Visibility className="w-3 h-3 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={client.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      validationErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {checkingDuplicates && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                )}
                {/* Duplicate Info Box for Phone */}
                {duplicateInfo.phone && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-amber-600 mr-2" />
                          <h4 className="text-sm font-medium text-amber-800">
                            Existing Client Found
                          </h4>
                        </div>
                        <p className="mt-1 text-sm text-amber-700">
                          <strong>{duplicateInfo.phone.clientName}</strong> already has this phone number.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/clients/${duplicateInfo.phone.clientId}`)}
                        className="ml-3 inline-flex items-center px-2.5 py-1.5 border border-amber-300 shadow-sm text-xs font-medium rounded text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                      >
                        <Visibility className="w-3 h-3 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Client Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer Type *
                </label>
                <select
                  required
                  value={client.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="individual">Individual</option>
                  <option value="broker">Broker</option>
                  <option value="agency">Agency</option>
                </select>
              </div>

              {/* Lead Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Where did they hear about us?
                </label>
                <select
                  value={client.leadSource}
                  onChange={(e) => handleInputChange('leadSource', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="walk-in">Walk-in</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="google">Google</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={client.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter address"
              />
            </div>

            {/* Buyer Status Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Buyer Status Management
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Buyer status is automatically managed based on their property listings:
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li><strong>Active:</strong> When buyer has active property listings</li>
                      <li><strong>Inactive:</strong> When all property listings are closed or cancelled</li>
                    </ul>
                    <p className="mt-2">
                      To assign this buyer to properties, go to the property details page and add them as a buyer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Preferences Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              Property Preferences
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              These preferences will help match this buyer with suitable properties.
            </p>
            
            {/* Property Types */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Property Types
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {propertyTypes.map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={client.preferences.propertyTypes.includes(type)}
                      onChange={() => handlePropertyTypeChange(type)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Budget Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Budget (₹)
                </label>
                <input
                  type="number"
                  value={client.preferences.budget.min}
                  onChange={(e) => handlePreferenceChange('budget', { ...client.preferences.budget, min: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Budget (₹)
                </label>
                <input
                  type="number"
                  value={client.preferences.budget.max}
                  onChange={(e) => handlePreferenceChange('budget', { ...client.preferences.budget, max: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Area Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Area (sq ft)
                </label>
                <input
                  type="number"
                  value={client.preferences.area.min}
                  onChange={(e) => handlePreferenceChange('area', { ...client.preferences.area, min: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Area (sq ft)
                </label>
                <input
                  type="number"
                  value={client.preferences.area.max}
                  onChange={(e) => handlePreferenceChange('area', { ...client.preferences.area, max: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Preferred Cities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Cities (comma separated)
              </label>
              <input
                type="text"
                value={client.preferences.cities.join(', ')}
                onChange={(e) => handlePreferenceChange('cities', e.target.value.split(',').map(city => city.trim()).filter(city => city))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Mumbai, Delhi, Bangalore"
              />
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              Additional Notes
            </h3>
            <textarea
              value={client.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Add any additional notes about this buyer..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : (isEditing ? 'Update Buyer' : 'Create Buyer')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddClient;