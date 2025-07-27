import React, { useState, useEffect } from 'react';
import { Button } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';
import GoogleAuthTest from '../components/GoogleAuthTest';
import apiService from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const Properties = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    city: '',
    type: ''
  });

  // Fetch properties from database
  const fetchProperties = async (page = 1, filterParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: 10,
        ...filterParams
      };
      
      const response = await apiService.getProperties(params);
      setProperties(response.properties);
      setTotalPages(response.totalPages);
      setTotalProperties(response.total);
      setCurrentPage(parseInt(page));
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load properties on component mount
  useEffect(() => {
    fetchProperties(1, filters);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchProperties(page, filters);
  };

  // Handle property deletion
  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteProperty(propertyId);
      // Refresh the current page
      fetchProperties(currentPage, filters);
      alert('Property deleted successfully!');
    } catch (err) {
      console.error('Error deleting property:', err);
      alert('Failed to delete property. Please try again.');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format price
  const formatPrice = (price) => {
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} Lac`;
    } else if (price >= 1000) {
      return `₹${(price / 1000).toFixed(1)}K`;
    }
    return `₹${price}`;
  };

  // Format area
  const formatArea = (area) => {
    if (area >= 10000) {
      return `${(area / 10000).toFixed(1)} acres`;
    }
    return `${area.toLocaleString()} sq ft`;
  };

  // Get property image
  const getPropertyImage = (property) => {
    if (property.files && property.files.length > 0) {
      return property.files[0].driveUrl;
    }
    return 'https://via.placeholder.com/200x150?text=No+Image';
  };

  if (loading && properties.length === 0) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading properties...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800 mb-4 sm:mb-0">
          Properties ({totalProperties})
        </h1>

        {/* Add Property Button */}
        <Button 
          color="blue" 
          onClick={() => navigate('/properties/add')} 
          className="w-full sm:w-auto font-semibold shadow-md"
        >
          + Add Property
        </Button>
      </div>

      {/* Google OAuth Test */}
      <div className="mb-6">
        <GoogleAuthTest />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Under Contract">Under Contract</option>
              <option value="Sold">Sold</option>
              <option value="Rented">Rented</option>
              <option value="Off Market">Off Market</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              placeholder="Enter city name"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Villa">Villa</option>
              <option value="Office">Office</option>
              <option value="Shop">Shop</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Land">Land</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Property Cards */}
      <div className="space-y-6">
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No properties found</div>
            <p className="text-gray-400">Try adjusting your filters or add a new property.</p>
          </div>
        ) : (
          properties.map((property) => (
            <div
              key={property._id}
              className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row hover:shadow-lg transition"
            >
              {/* Image */}
              <img
                src={getPropertyImage(property)}
                alt={property.title}
                className="w-full md:w-60 h-48 object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/200x150?text=No+Image';
                }}
              />

              {/* Middle Info */}
              <div className="flex-1 p-4">
                <h2 className="text-lg font-semibold text-gray-800">{property.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  📅 Posted: {formatDate(property.createdAt)}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mt-2 text-sm">
                  <p><span className="font-medium">Super Area:</span> {formatArea(property.area)}</p>
                  <p><span className="font-medium">Furnishing:</span> {property.furnishing || 'N/A'}</p>
                  <p><span className="font-medium">Type:</span> {property.type}</p>
                  <p><span className="font-medium">Zoning:</span> {property.zoning}</p>
                  <p><span className="font-medium">Age:</span> {property.ageDisplay || 'N/A'}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                      property.status === 'Available' ? 'bg-green-100 text-green-800' :
                      property.status === 'Under Contract' ? 'bg-yellow-100 text-yellow-800' :
                      property.status === 'Sold' ? 'bg-blue-100 text-blue-800' :
                      property.status === 'Rented' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {property.status}
                    </span>
                  </p>
                </div>

                <div className="mt-3 text-sm text-gray-700">
                  <p><span className="font-semibold">Location:</span> {property.city}</p>
                  {property.owner && (
                    <p><span className="font-semibold">Owner:</span> {property.owner.name}</p>
                  )}
                </div>
              </div>

              {/* Right Side: Price + Actions */}
              <div className="p-4 flex flex-col justify-between items-end w-full md:w-52 border-t md:border-t-0 md:border-l">
                <div>
                  <p className="text-lg font-bold text-gray-900">{formatPrice(property.totalPrice)}</p>
                  <p className="text-sm text-gray-500">₹{property.perSqFtRate}/sq ft</p>
                </div>
                <div className="flex flex-col gap-2 mt-4 md:mt-0">
                  <Button
                    size="xs"
                    color="gray"
                    onClick={() => navigate(`/properties/${property._id}`)}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="xs" 
                    color="blue" 
                    onClick={() => navigate(`/properties/edit/${property._id}`)}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="xs" 
                    color="failure" 
                    onClick={() => handleDeleteProperty(property._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <Button
              size="sm"
              color="gray"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                size="sm"
                color={currentPage === page ? "blue" : "gray"}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
            
            <Button
              size="sm"
              color="gray"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;