import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Alert,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Container,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useNavigate, useParams } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import googleDriveService from '../services/googleDriveService';
import apiService from '../services/apiService';

const AddProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get property ID if editing
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    address: '',
    city: '',
    zoning: '',
    zoningNote: '', // Add this field for mixed use notes
    furnishing: '',
    ageYear: '',
    ageMonth: '',
    type: '',
    area: '',
    perSqFtRate: '',
    owner: '',
    ref: '',
    status: '',
    notes: '',
    additionalNotes: ''
  });
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]); // Add files state
  
  // Owner selection states
  const [ownerSelection, setOwnerSelection] = useState('existing'); // 'existing' or 'new'
  const [selectedOwner, setSelectedOwner] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [showNewOwnerForm, setShowNewOwnerForm] = useState(false);
  const [newOwner, setNewOwner] = useState({ name: '', email: '', phone: '', address: '' });
  
  // Ref selection states
  const [refSelection, setRefSelection] = useState('existing'); // 'existing' or 'new'
  const [selectedRef, setSelectedRef] = useState('');
  const [selectedRefId, setSelectedRefId] = useState('');
  const [showNewRefForm, setShowNewRefForm] = useState(false);
  const [newRef, setNewRef] = useState({ name: '', email: '', phone: '', address: '' });

  // Mock data - replace with real data from backend
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
  const zoningTypes = ['Residential', 'Commercial', 'Industrial', 'Mixed Use', 'Agricultural'];
  const furnishingOptions = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
  const propertyTypes = ['Apartment', 'House', 'Villa', 'Office', 'Shop', 'Warehouse', 'Land'];
  const statusOptions = ['Available', 'Under Contract', 'Sold', 'Rented', 'Off Market'];
  const years = Array.from({ length: 50 }, (_, i) => 2024 - i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Mock users from DB - replace with real API call
  const existingUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+91-9876543210', address: 'Mumbai, Maharashtra' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+91-9876543211', address: 'Delhi, NCR' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+91-9876543212', address: 'Bangalore, Karnataka' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', phone: '+91-9876543213', address: 'Chennai, Tamil Nadu' }
  ];

  // Calculate total price
  const totalPrice = form.area && form.perSqFtRate 
    ? (parseFloat(form.area) * parseFloat(form.perSqFtRate)).toFixed(2)
    : '';

  // Required fields
  const requiredFields = ['title', 'address', 'city', 'type', 'area', 'perSqFtRate', 'status'];

  // Load property data if editing
  useEffect(() => {
    if (id) {
      setIsEditing(true);
      loadPropertyData();
    }
  }, [id]);

  const loadPropertyData = async () => {
    try {
      setLoading(true);
      const propertyData = await apiService.getProperty(id);
      
      // Populate form with existing data
      setForm({
        title: propertyData.title || '',
        address: propertyData.address || '',
        city: propertyData.city || '',
        zoning: propertyData.zoning || '',
        zoningNote: propertyData.zoningNote || '',
        furnishing: propertyData.furnishing || '',
        ageYear: propertyData.age?.year || '',
        ageMonth: propertyData.age?.month || '',
        type: propertyData.type || '',
        area: propertyData.area || '',
        perSqFtRate: propertyData.perSqFtRate || '',
        owner: propertyData.owner?.name || '',
        ref: propertyData.ref?.name || '',
        status: propertyData.status || '',
        notes: propertyData.notes || '',
        additionalNotes: propertyData.additionalNotes || ''
      });

              // Set files if they exist
        if (propertyData.files && propertyData.files.length > 0) {
          setFiles(propertyData.files.map(file => ({
            id: file._id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            originalSize: file.originalSize,
            driveId: file.driveId,
            driveUrl: file.driveUrl,
            compressionRatio: file.compressionRatio || 0,
            uploaded: true
          })));
        }

      // Set owner selection
      if (propertyData.owner) {
        setOwnerSelection('existing');
        setSelectedOwner(propertyData.owner.name);
        setSelectedOwnerId(propertyData.owner._id);
      }

      // Set ref selection
      if (propertyData.ref) {
        setRefSelection('existing');
        setSelectedRef(propertyData.ref.name);
        setSelectedRefId(propertyData.ref._id);
      }

    } catch (error) {
      console.error('Error loading property data:', error);
      alert('Error loading property data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Reset zoning note when zoning changes to something other than "Mixed Use"
    if (name === 'zoning' && value !== 'Mixed Use') {
      setForm(prev => ({ ...prev, zoningNote: '' }));
    }
  };

  const handleNewOwnerChange = (field, value) => {
    setNewOwner(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    const errorKey = `newOwner${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const handleNewRefChange = (field, value) => {
    setNewRef(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    const errorKey = `newRef${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  // Handle owner selection change
  const handleOwnerSelectionChange = (e) => {
    const newSelection = e.target.value;
    setOwnerSelection(newSelection);
    
    // Reset dropdown selection when switching to "new user"
    if (newSelection === 'new') {
      setSelectedOwner('');
      setSelectedOwnerId('');
    }
  };

  // Handle reference selection change
  const handleRefSelectionChange = (e) => {
    const newSelection = e.target.value;
    setRefSelection(newSelection);
    
    // Reset dropdown selection when switching to "new user"
    if (newSelection === 'new') {
      setSelectedRef('');
      setSelectedRefId('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required field validation
    requiredFields.forEach(field => {
      if (!form[field] || form[field].toString().trim() === '') {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    // Specific field validations
    if (form.title && form.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    }

    if (form.address && form.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters long';
    }

    // Validate area (must be positive number)
    if (form.area) {
      const areaNum = parseFloat(form.area);
      if (isNaN(areaNum) || areaNum <= 0) {
        newErrors.area = 'Area must be a positive number';
      } else if (areaNum > 1000000) {
        newErrors.area = 'Area seems too large. Please check the value';
      }
    }

    // Validate per sq ft rate (must be positive number)
    if (form.perSqFtRate) {
      const rateNum = parseFloat(form.perSqFtRate);
      if (isNaN(rateNum) || rateNum <= 0) {
        newErrors.perSqFtRate = 'Rate must be a positive number';
      } else if (rateNum > 100000) {
        newErrors.perSqFtRate = 'Rate seems too high. Please check the value';
      }
    }

    // Validate age fields
    if (form.ageYear && (isNaN(form.ageYear) || form.ageYear < 1900 || form.ageYear > 2024)) {
      newErrors.ageYear = 'Please enter a valid year between 1900 and 2024';
    }

    // Validate zoning note when Mixed Use is selected
    if (form.zoning === 'Mixed Use' && (!form.zoningNote || form.zoningNote.trim().length < 5)) {
      newErrors.zoningNote = 'Please specify the mixed use details (at least 5 characters)';
    }

    // Validate owner selection
    if (ownerSelection === 'existing' && !selectedOwnerId) {
      newErrors.owner = 'Please select an owner';
    }
    if (ownerSelection === 'new') {
      if (!newOwner.name || newOwner.name.trim().length < 2) {
        newErrors.newOwnerName = 'Owner name must be at least 2 characters';
      }
      if (!newOwner.email || !isValidEmail(newOwner.email)) {
        newErrors.newOwnerEmail = 'Please enter a valid email address';
      }
      if (!newOwner.phone || newOwner.phone.trim().length < 10) {
        newErrors.newOwnerPhone = 'Please enter a valid phone number';
      }
    }

    // Validate ref selection (optional but if selected, must be valid)
    if (refSelection === 'existing' && !selectedRefId) {
      newErrors.ref = 'Please select a reference';
    }
    if (refSelection === 'new') {
      if (!newRef.name || newRef.name.trim().length < 2) {
        newErrors.newRefName = 'Reference name must be at least 2 characters';
      }
      if (!newRef.email || !isValidEmail(newRef.email)) {
        newErrors.newRefEmail = 'Please enter a valid email address';
      }
      if (!newRef.phone || newRef.phone.trim().length < 10) {
        newErrors.newRefPhone = 'Please enter a valid phone number';
      }
    }

    // Validate notes length
    if (form.notes && form.notes.trim().length > 1000) {
      newErrors.notes = 'Notes must be less than 1000 characters';
    }

    if (form.additionalNotes && form.additionalNotes.trim().length > 1000) {
      newErrors.additionalNotes = 'Additional notes must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to validate email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        // Upload files to Google Drive first
        const uploadedFiles = [];
        
        if (files.length > 0) {
          // Show progress message
          alert('Uploading files to Google Drive... Please wait.');
          
          for (let i = 0; i < files.length; i++) {
            const fileObj = files[i];
            
            try {
              if (!fileObj.uploaded) {
                // Upload to Google Drive
                const driveResult = await googleDriveService.uploadFile(fileObj.file);
                
                uploadedFiles.push({
                  id: fileObj.id,
                  name: fileObj.name,
                  type: fileObj.type,
                  size: fileObj.size,
                  originalSize: fileObj.originalSize,
                  driveId: driveResult.id,
                  driveUrl: driveResult.webViewLink,
                  compressionRatio: fileObj.compressionRatio
                });
                
                console.log(`File ${i + 1}/${files.length} uploaded:`, driveResult);
              } else {
                // File already uploaded
                uploadedFiles.push({
                  id: fileObj.id,
                  name: fileObj.name,
                  type: fileObj.type,
                  size: fileObj.size,
                  originalSize: fileObj.originalSize,
                  driveId: fileObj.driveId,
                  driveUrl: fileObj.driveUrl,
                  compressionRatio: fileObj.compressionRatio
                });
              }
            } catch (uploadError) {
              console.error(`Failed to upload ${fileObj.name}:`, uploadError);
              alert(`Failed to upload ${fileObj.name}. Please try again.`);
              return; // Stop the process if upload fails
            }
          }
        }

        // Prepare final data
        const propertyData = {
          ...form,
          owner: ownerSelection === 'existing' ? selectedOwner : newOwner,
          ref: refSelection === 'existing' ? selectedRef : newRef,
          ownerType: ownerSelection,
          refType: refSelection,
          files: uploadedFiles.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size,
            originalSize: file.originalSize,
            driveId: file.driveId,
            driveUrl: file.driveUrl,
            compressionRatio: Math.max(0, file.compressionRatio || 0) // Ensure non-negative
          })),
          totalPrice: totalPrice,
          createdAt: new Date().toISOString()
        };

        // Clean up age fields - don't send empty strings
        if (!propertyData.ageYear || propertyData.ageYear === '') {
          delete propertyData.ageYear;
        }
        if (!propertyData.ageMonth || propertyData.ageMonth === '') {
          delete propertyData.ageMonth;
        }
        
        // Send to backend API
        let response;
        if (isEditing) {
          response = await apiService.updateProperty(id, propertyData);
          alert('Property updated successfully! All files uploaded to Google Drive.');
        } else {
          response = await apiService.createProperty(propertyData);
          alert('Property added successfully! All files uploaded to Google Drive.');
        }
        
        navigate('/properties');
      } catch (error) {
        console.error('Error saving property:', error);
        alert('Error saving property. Please try again.');
      }
    }
  };

  const handleAddNewOwner = async () => {
    if (newOwner.name && newOwner.email) {
      try {
        // TODO: API call to add new user to database
        // const response = await fetch('/api/users', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(newOwner)
        // });
        // const addedUser = await response.json();
        
        // Mock response
        const addedUser = {
          id: Date.now(),
          ...newOwner
        };
        
        // Update form with new owner
        setForm(prev => ({ ...prev, owner: addedUser.name }));
        setSelectedOwner(addedUser.name);
        setShowNewOwnerForm(false);
        setNewOwner({ name: '', email: '', phone: '', address: '' });
        
        alert('New owner added successfully!');
      } catch (error) {
        alert('Error adding new owner: ' + error.message);
      }
    }
  };

  const handleAddNewRef = async () => {
    if (newRef.name && newRef.email) {
      try {
        // TODO: API call to add new user to database
        // const response = await fetch('/api/users', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(newRef)
        // });
        // const addedUser = await response.json();
        
        // Mock response
        const addedUser = {
          id: Date.now(),
          ...newRef
        };
        
        // Update form with new ref
        setForm(prev => ({ ...prev, ref: addedUser.name }));
        setSelectedRef(addedUser.name);
        setShowNewRefForm(false);
        setNewRef({ name: '', email: '', phone: '', address: '' });
        
        alert('New reference added successfully!');
      } catch (error) {
        alert('Error adding new reference: ' + error.message);
      }
    }
  };

  if (loading && isEditing) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, md: 3.5 }, 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              Loading property data...
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, md: 3.5 }, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            mb: 3, 
            fontWeight: 'bold', 
            color: 'primary.main',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {isEditing ? '✏️ Edit Property' : '🏠 Add New Property'}
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Basic Information */}
            <Card 
              elevation={2} 
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid #e3e6f0'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  📍 Basic Information
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Property Title *"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      fullWidth
                      error={!!errors.title}
                      helperText={errors.title}
                      required
                      size="medium"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          fontSize: '1rem',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                            borderWidth: 1.5
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Address *"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.address}
                      helperText={errors.address}
                      required
                      size="medium"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          fontSize: '1rem',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                            borderWidth: 1.5
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.city} required size="medium">
                      <InputLabel sx={{ fontSize: '1rem' }}>City *</InputLabel>
                      <Select
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        label="City *"
                        sx={{ 
                          fontSize: '1rem',
                          height: '56px',
                          minWidth: '200px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db',
                            borderWidth: 1.5
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              minWidth: '200px'
                            }
                          }
                        }}
                      >
                        {cities.map(city => (
                          <MenuItem key={city} value={city} sx={{ fontSize: '0.95rem' }}>{city}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="medium">
                      <InputLabel sx={{ fontSize: '1rem' }}>Zoning</InputLabel>
                      <Select
                        name="zoning"
                        value={form.zoning}
                        onChange={handleChange}
                        label="Zoning"
                        sx={{ 
                          fontSize: '1rem',
                          height: '56px',
                          minWidth: '200px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db',
                            borderWidth: 1.5
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              minWidth: '200px'
                            }
                          }
                        }}
                      >
                        {zoningTypes.map(zone => (
                          <MenuItem key={zone} value={zone} sx={{ fontSize: '0.95rem' }}>{zone}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Zoning Note Field - Only show when Mixed Use is selected */}
                  {form.zoning === 'Mixed Use' && (
                    <Grid item xs={12}>
                      <TextField
                        label="Mixed Use Details *"
                        name="zoningNote"
                        value={form.zoningNote}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Please specify the types of mixed use (e.g., Residential + Commercial, Office + Retail, etc.)"
                        required
                        error={!!errors.zoningNote}
                        helperText={errors.zoningNote}
                        size="medium"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            fontSize: '1rem',
                            '& fieldset': {
                              borderColor: '#d1d5db',
                              borderWidth: 1.5
                            },
                            '&:hover fieldset': {
                              borderColor: 'primary.main'
                            }
                          }
                        }}
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card 
              elevation={2} 
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid #e3e6f0'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  🏠 Property Details
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="medium">
                      <InputLabel sx={{ fontSize: '1rem' }}>Furnishing</InputLabel>
                      <Select
                        name="furnishing"
                        value={form.furnishing}
                        onChange={handleChange}
                        label="Furnishing"
                        sx={{ 
                          fontSize: '1rem',
                          height: '56px',
                          minWidth: '200px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db',
                            borderWidth: 1.5
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              minWidth: '200px'
                            }
                          }
                        }}
                      >
                        {furnishingOptions.map(option => (
                          <MenuItem key={option} value={option} sx={{ fontSize: '0.95rem' }}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required error={!!errors.type} size="medium">
                      <InputLabel sx={{ fontSize: '1rem' }}>Property Type *</InputLabel>
                      <Select
  name="type"
  value={form.type}
  onChange={handleChange}
  label="Property Type *"
  sx={{ 
    fontSize: '1rem',
    height: '56px',
    minWidth: '200px',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#d1d5db',
      borderWidth: 1.5
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main'
    }
  }}
  MenuProps={{
    PaperProps: {
      sx: {
        minWidth: '220px'
      }
    }
  }}
>
                        {propertyTypes.map(type => (
                          <MenuItem key={type} value={type} sx={{ fontSize: '0.95rem' }}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="medium">
                      <InputLabel sx={{ fontSize: '1rem' }}>Age - Year</InputLabel>
                      <Select
                        name="ageYear"
                        value={form.ageYear}
                        onChange={handleChange}
                        label="Age - Year"
                        sx={{ 
                          fontSize: '1rem',
                          height: '56px',
                          minWidth: '200px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db',
                            borderWidth: 1.5
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              minWidth: '200px'
                            }
                          }
                        }}
                      >
                        {years.map(year => (
                          <MenuItem key={year} value={year} sx={{ fontSize: '0.95rem' }}>{year}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="medium">
                      <InputLabel sx={{ fontSize: '1rem' }}>Age - Month</InputLabel>
                      <Select
                        name="ageMonth"
                        value={form.ageMonth}
                        onChange={handleChange}
                        label="Age - Month"
                        sx={{ 
                          fontSize: '1rem',
                          height: '56px',
                          minWidth: '200px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db',
                            borderWidth: 1.5
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              minWidth: '200px'
                            }
                          }
                        }}
                      >
                        {months.map(month => (
                          <MenuItem key={month} value={month} sx={{ fontSize: '0.95rem' }}>{month}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card 
              elevation={2} 
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid #e3e6f0'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  💰 Pricing
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Area (sq ft) *"
                      name="area"
                      type="number"
                      value={form.area}
                      onChange={handleChange}
                      fullWidth
                      error={!!errors.area}
                      helperText={errors.area}
                      required
                      inputProps={{ min: 0 }}
                      size="medium"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          fontSize: '1rem',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                            borderWidth: 1.5
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Per sq ft Rate *"
                      name="perSqFtRate"
                      type="number"
                      value={form.perSqFtRate}
                      onChange={handleChange}
                      fullWidth
                      error={!!errors.perSqFtRate}
                      helperText={errors.perSqFtRate}
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                      size="medium"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          fontSize: '1rem',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                            borderWidth: 1.5
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                    />
                  </Grid>

                  {totalPrice && (
                    <Grid item xs={12}>
                      <Alert 
                        severity="success" 
                        sx={{ 
                          mt: 2,
                          borderRadius: 2,
                          '& .MuiAlert-message': {
                            fontSize: '1rem'
                          }
                        }}
                      >
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Total Price: ₹{parseFloat(totalPrice).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          Calculated: {form.area} sq ft × ₹{form.perSqFtRate}/sq ft
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Owner Selection */}
            <Card 
              elevation={2} 
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid #e3e6f0'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  👤 Owner Selection *
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl component="fieldset" error={!!errors.owner}>
                      <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold', fontSize: '1rem' }}>
                        Select Owner Type
                      </FormLabel>
                      <RadioGroup
                        row
                        value={ownerSelection}
                        onChange={handleOwnerSelectionChange}
                        sx={{ mb: 3 }}
                      >
                        <FormControlLabel 
                          value="existing" 
                          control={<Radio />} 
                          label="Select from existing users" 
                          sx={{ fontSize: '1rem' }}
                        />
                        <FormControlLabel 
                          value="new" 
                          control={<Radio />} 
                          label="Add new user" 
                          sx={{ fontSize: '1rem' }}
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  {ownerSelection === 'existing' && (
                    <Grid item xs={12}>
                      <FormControl fullWidth error={!!errors.owner} required size="medium">
                        <InputLabel sx={{ fontSize: '1rem' }}>Select Owner *</InputLabel>
                        <Select
                          value={selectedOwnerId}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            setSelectedOwnerId(selectedId);
                            const selectedUser = existingUsers.find(user => user.id === selectedId);
                            setSelectedOwner(selectedUser ? selectedUser.name : '');
                          }}
                          label="Select Owner *"
                          sx={{ 
                            fontSize: '1rem',
                            height: '56px',
                            minWidth: '250px',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#d1d5db',
                              borderWidth: 1.5
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main'
                            }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                minWidth: '250px'
                              }
                            }
                          }}
                        >
                          {existingUsers.map(user => (
                            <MenuItem key={user.id} value={user.name} sx={{ fontSize: '0.95rem' }}>
                              {user.name} ({user.email}) - {user.phone}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.owner && (
                          <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.owner}</Typography>
                        )}
                      </FormControl>
                    </Grid>
                  )}

                  {ownerSelection === 'new' && (
                    <Grid item xs={12}>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 3, 
                          bgcolor: 'grey.50', 
                          borderRadius: 2,
                          border: '1px solid #e3e6f0'
                        }}
                      >
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                          Add New Owner
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Name *"
                              value={newOwner.name}
                              onChange={(e) => handleNewOwnerChange('name', e.target.value)}
                              fullWidth
                              required
                              size="medium"
                              error={!!errors.newOwnerName}
                              helperText={errors.newOwnerName}
                              sx={{ 
                                '& .MuiOutlinedInput-root': {
                                  fontSize: '1rem',
                                  '& fieldset': {
                                    borderColor: errors.newOwnerName ? 'error.main' : '#d1d5db',
                                    borderWidth: 1.5
                                  },
                                  '&:hover fieldset': {
                                    borderColor: errors.newOwnerName ? 'error.main' : 'primary.main'
                                  }
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Email *"
                              type="email"
                              value={newOwner.email}
                              onChange={(e) => handleNewOwnerChange('email', e.target.value)}
                              fullWidth
                              required
                              size="medium"
                              error={!!errors.newOwnerEmail}
                              helperText={errors.newOwnerEmail}
                              sx={{ 
                                '& .MuiOutlinedInput-root': {
                                  fontSize: '1rem',
                                  '& fieldset': {
                                    borderColor: errors.newOwnerEmail ? 'error.main' : '#d1d5db',
                                    borderWidth: 1.5
                                  },
                                  '&:hover fieldset': {
                                    borderColor: errors.newOwnerEmail ? 'error.main' : 'primary.main'
                                  }
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Phone *"
                              value={newOwner.phone}
                              onChange={(e) => handleNewOwnerChange('phone', e.target.value)}
                              fullWidth
                              required
                              size="medium"
                              error={!!errors.newOwnerPhone}
                              helperText={errors.newOwnerPhone}
                              sx={{ 
                                '& .MuiOutlinedInput-root': {
                                  fontSize: '1rem',
                                  '& fieldset': {
                                    borderColor: errors.newOwnerPhone ? 'error.main' : '#d1d5db',
                                    borderWidth: 1.5
                                  },
                                  '&:hover fieldset': {
                                    borderColor: errors.newOwnerPhone ? 'error.main' : 'primary.main'
                                  }
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Address"
                              value={newOwner.address}
                              onChange={(e) => handleNewOwnerChange('address', e.target.value)}
                              fullWidth
                              size="medium"
                              sx={{ 
                                '& .MuiOutlinedInput-root': {
                                  fontSize: '1rem',
                                  '& fieldset': {
                                    borderColor: '#d1d5db',
                                    borderWidth: 1.5
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'primary.main'
                                  }
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Button 
                              variant="contained" 
                              onClick={handleAddNewOwner}
                              disabled={!newOwner.name || !newOwner.email}
                              size="medium"
                              sx={{ 
                                mt: 1,
                                px: 3,
                                py: 1,
                                fontSize: '1rem',
                                borderRadius: 1.5
                              }}
                            >
                              Add Owner to Database
                            </Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Reference Selection */}
            <Card 
              elevation={2} 
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid #e3e6f0'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  📞 Reference Selection
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl component="fieldset" error={!!errors.ref}>
                      <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold', fontSize: '1rem' }}>
                        Select Reference Type
                      </FormLabel>
                      <RadioGroup
                        row
                        value={refSelection}
                        onChange={handleRefSelectionChange}
                        sx={{ mb: 3 }}
                      >
                        <FormControlLabel 
                          value="existing" 
                          control={<Radio />} 
                          label="Select from existing users" 
                          sx={{ fontSize: '1rem' }}
                        />
                        <FormControlLabel 
                          value="new" 
                          control={<Radio />} 
                          label="Add new user" 
                          sx={{ fontSize: '1rem' }}
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  {refSelection === 'existing' && (
                    <Grid item xs={12}>
                      <FormControl fullWidth error={!!errors.ref} size="medium">
                        <InputLabel sx={{ fontSize: '1rem' }}>Select Reference</InputLabel>
                        <Select
                          value={selectedRefId}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            setSelectedRefId(selectedId);
                            const selectedUser = existingUsers.find(user => user.id === selectedId);
                            setSelectedRef(selectedUser ? selectedUser.name : '');
                          }}
                          label="Select Reference"
                          sx={{ 
                            fontSize: '1rem',
                            height: '56px',
                            minWidth: '250px',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#d1d5db',
                              borderWidth: 1.5
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main'
                            }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                minWidth: '250px'
                              }
                            }
                          }}
                        >
                          {existingUsers.map(user => (
                            <MenuItem key={user.id} value={user.name} sx={{ fontSize: '0.95rem' }}>
                              {user.name} ({user.email}) - {user.phone}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.ref && (
                          <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.ref}</Typography>
                        )}
                      </FormControl>
                    </Grid>
                  )}

                  {refSelection === 'new' && (
                    <Grid item xs={12}>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 3, 
                          bgcolor: 'grey.50', 
                          borderRadius: 2,
                          border: '1px solid #e3e6f0'
                        }}
                      >
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                          Add New Reference
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Name *"
                              value={newRef.name}
                              onChange={(e) => handleNewRefChange('name', e.target.value)}
                              fullWidth
                              required
                              size="medium"
                              error={!!errors.newRefName}
                              helperText={errors.newRefName}
                              sx={{ 
                                '& .MuiOutlinedInput-root': {
                                  fontSize: '1rem',
                                  '& fieldset': {
                                    borderColor: errors.newRefName ? 'error.main' : '#d1d5db',
                                    borderWidth: 1.5
                                  },
                                  '&:hover fieldset': {
                                    borderColor: errors.newRefName ? 'error.main' : 'primary.main'
                                  }
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Email *"
                              type="email"
                              value={newRef.email}
                              onChange={(e) => handleNewRefChange('email', e.target.value)}
                              fullWidth
                              required
                              size="medium"
                              error={!!errors.newRefEmail}
                              helperText={errors.newRefEmail}
                              sx={{ 
                                '& .MuiOutlinedInput-root': {
                                  fontSize: '1rem',
                                  '& fieldset': {
                                    borderColor: errors.newRefEmail ? 'error.main' : '#d1d5db',
                                    borderWidth: 1.5
                                  },
                                  '&:hover fieldset': {
                                    borderColor: errors.newRefEmail ? 'error.main' : 'primary.main'
                                  }
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Phone *"
                              value={newRef.phone}
                              onChange={(e) => handleNewRefChange('phone', e.target.value)}
                              fullWidth
                              required
                              size="medium"
                              error={!!errors.newRefPhone}
                              helperText={errors.newRefPhone}
                              sx={{ 
                                '& .MuiOutlinedInput-root': {
                                  fontSize: '1rem',
                                  '& fieldset': {
                                    borderColor: errors.newRefPhone ? 'error.main' : '#d1d5db',
                                    borderWidth: 1.5
                                  },
                                  '&:hover fieldset': {
                                    borderColor: errors.newRefPhone ? 'error.main' : 'primary.main'
                                  }
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Address"
                              value={newRef.address}
                              onChange={(e) => handleNewRefChange('address', e.target.value)}
                              fullWidth
                              size="medium"
                              sx={{ 
                                '& .MuiOutlinedInput-root': {
                                  fontSize: '1rem',
                                  '& fieldset': {
                                    borderColor: '#d1d5db',
                                    borderWidth: 1.5
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'primary.main'
                                  }
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Button 
                              variant="contained" 
                              onClick={handleAddNewRef}
                              disabled={!newRef.name || !newRef.email}
                              size="medium"
                              sx={{ 
                                mt: 1,
                                px: 3,
                                py: 1,
                                fontSize: '1rem',
                                borderRadius: 1.5
                              }}
                            >
                              Add Reference to Database
                            </Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Status & Notes */}
            <Card 
              elevation={2} 
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid #e3e6f0'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  📝 Status & Notes
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.status} required size="medium">
                      <InputLabel sx={{ fontSize: '1rem' }}>Status *</InputLabel>
                      <Select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        label="Status *"
                        sx={{ 
                          fontSize: '1rem',
                          height: '56px',
                          minWidth: '200px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db',
                            borderWidth: 1.5
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              minWidth: '200px'
                            }
                          }
                        }}
                      >
                        {statusOptions.map(status => (
                          <MenuItem key={status} value={status} sx={{ fontSize: '0.95rem' }}>{status}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Notes"
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Additional notes about the property..."
                      size="medium"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          fontSize: '1rem',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                            borderWidth: 1.5
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Additional Notes"
                      name="additionalNotes"
                      value={form.additionalNotes}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Any additional information, special requirements, or detailed notes..."
                      size="medium"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          fontSize: '1rem',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                            borderWidth: 1.5
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Photos & Videos */}
            <Card 
              elevation={2} 
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid #e3e6f0'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <FileUpload 
                  files={files}
                  setFiles={setFiles}
                  maxFiles={10}
                  maxSizeMB={10}
                />
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'center',
              pt: 3,
              borderTop: '2px solid',
              borderColor: 'divider'
            }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/properties')}
                size="medium"
                sx={{ 
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                size="medium"
                disabled={loading}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                    boxShadow: '0 3px 7px 2px rgba(25, 118, 210, .4)'
                  }
                }}
              >
                {loading ? 'Saving...' : (isEditing ? 'Update Property' : 'Add Property')}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default AddProperty; 