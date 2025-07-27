import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'flowbite-react';
import apiService from '../services/apiService';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getProperty(id);
      setProperty(data);
    } catch (err) {
      console.error('Error fetching property details:', err);
      setError('Failed to load property details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} Lac`;
    } else if (price >= 1000) {
      return `₹${(price / 1000).toFixed(1)}K`;
    }
    return `₹${price}`;
  };

  const formatArea = (area) => {
    if (area >= 10000) {
      return `${(area / 10000).toFixed(1)} acres`;
    }
    return `${area.toLocaleString()} sq ft`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Under Contract': return 'bg-yellow-100 text-yellow-800';
      case 'Sold': return 'bg-blue-100 text-blue-800';
      case 'Rented': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading property details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
        <Button onClick={() => navigate('/properties')} color="gray">
          Back to Properties
        </Button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Property Not Found</h2>
          <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/properties')} color="blue">
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <Button 
            onClick={() => navigate('/properties')} 
            color="gray" 
            className="mb-4 sm:mb-0"
          >
            ← Back to Properties
          </Button>
          <h1 className="text-3xl font-semibold text-gray-800 mt-2">{property.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate(`/properties/edit/${property._id}`)} 
            color="blue"
          >
            Edit Property
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {property.files && property.files.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                <img
                  src={property.files[activeImageIndex]?.driveUrl || 'https://via.placeholder.com/600x400?text=No+Image'}
                  alt={property.title}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x400?text=No+Image';
                  }}
                />
                {property.files.length > 1 && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex gap-2 overflow-x-auto">
                      {property.files.map((file, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded border-2 ${
                            index === activeImageIndex ? 'border-blue-500' : 'border-white'
                          }`}
                        >
                          <img
                            src={file.driveUrl}
                            alt={`${property.title} - Image ${index + 1}`}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/64x64?text=Error';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Property Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Property Type</p>
                <p className="font-medium">{property.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Zoning</p>
                <p className="font-medium">{property.zoning}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Area</p>
                <p className="font-medium">{formatArea(property.area)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Furnishing</p>
                <p className="font-medium">{property.furnishing || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-medium">{property.ageDisplay || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                  {property.status}
                </span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Location</h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">City</p>
              <p className="font-medium">{property.city}</p>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{property.address}</p>
            </div>
          </div>

          {/* Notes */}
          {(property.notes || property.additionalNotes) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Notes</h2>
              {property.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">General Notes</p>
                  <p className="text-gray-700">{property.notes}</p>
                </div>
              )}
              {property.additionalNotes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                  <p className="text-gray-700">{property.additionalNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Zoning Note for Mixed Use */}
          {property.zoning === 'Mixed Use' && property.zoningNote && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Mixed Use Details</h2>
              <p className="text-gray-700">{property.zoningNote}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pricing</h2>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(property.totalPrice)}</p>
                <p className="text-sm text-gray-500">Total Price</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">₹{property.perSqFtRate.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Per sq ft</p>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          {property.owner && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Owner Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{property.owner.name}</p>
                </div>
                {property.owner.email && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{property.owner.email}</p>
                  </div>
                )}
                {property.owner.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{property.owner.phone}</p>
                  </div>
                )}
                {property.owner.address && (
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{property.owner.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reference Information */}
          {property.ref && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Reference Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{property.ref.name}</p>
                </div>
                {property.ref.email && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{property.ref.email}</p>
                  </div>
                )}
                {property.ref.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{property.ref.phone}</p>
                  </div>
                )}
                {property.ref.address && (
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{property.ref.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Property Metadata */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Info</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{formatDate(property.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDate(property.updatedAt)}</p>
              </div>
              {property.createdBy && (
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-medium">{property.createdBy.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
