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
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Container,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useNavigate, useParams } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import googleDriveService from '../services/googleDriveService';
import apiService from '../services/apiService';

const AddProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Step management
  const [activeStep, setActiveStep] = useState(0);
  const [stepsCompleted, setStepsCompleted] = useState({
    owner: false,
    property: false,
    reference: false
  });
  
  // Form state
  const [form, setForm] = useState({
    title: '',
    address: '',
    city: '',
    zoning: '',
    zoningNote: '',
    furnishing: '',
    ageYear: '',
    ageMonth: '',
    type: '',
    area: '',
    perSqFtRate: '',
    status: 'Available',
    notes: '',
    additionalNotes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);
  
  // Owner selection states
  const [ownerSelection, setOwnerSelection] = useState('existing');
  const [selectedOwner, setSelectedOwner] = useState('');
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [newOwner, setNewOwner] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '',
    type: 'individual',
    leadSource: 'other'
  });
  const [ownerValidationErrors, setOwnerValidationErrors] = useState({});
  
  // Ref selection states
  const [refSelection, setRefSelection] = useState('existing');
  const [selectedRef, setSelectedRef] = useState('');
  const [selectedRefId, setSelectedRefId] = useState('');
  const [newRef, setNewRef] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '',
    type: 'individual',
    leadSource: 'other'
  });
  const [refValidationErrors, setRefValidationErrors] = useState({});
  
  // Database states
  const [existingClients, setExistingClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  
  // Dialog states
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);
  const [showRefDialog, setShowRefDialog] = useState(false);
  const [validatingOwner, setValidatingOwner] = useState(false);
  const [validatingRef, setValidatingRef] = useState(false);

  // Constants
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
  const zoningTypes = ['Residential', 'Commercial', 'Industrial', 'Mixed Use', 'Agricultural'];
  const furnishingOptions = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
  const propertyTypes = ['Apartment', 'House', 'Villa', 'Office', 'Shop', 'Warehouse', 'Land'];
  const statusOptions = ['Available', 'Under Contract', 'Sold', 'Rented']; // Removed 'Off Market'
  const years = Array.from({ length: 50 }, (_, i) => 2024 - i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
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

  // Load existing clients
  useEffect(() => {
    loadExistingClients();
  }, []);

  const loadExistingClients = async () => {
    try {
      setLoadingClients(true);
      const response = await apiService.getClients({ limit: 1000 });
      setExistingClients(response.clients || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadPropertyData = async () => {
    try {
      setLoading(true);
      const propertyData = await apiService.getProperty(id);
      
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
        status: propertyData.status || 'Available',
        notes: propertyData.notes || '',
        additionalNotes: propertyData.additionalNotes || ''
      });

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
        setStepsCompleted(prev => ({ ...prev, owner: true }));
      }

      // Set ref selection
      if (propertyData.ref) {
        setRefSelection('existing');
        setSelectedRef(propertyData.ref.name);
        setSelectedRefId(propertyData.ref._id);
        setStepsCompleted(prev => ({ ...prev, reference: true }));
      }

      setStepsCompleted(prev => ({ ...prev, property: true }));

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
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'zoning' && value !== 'Mixed Use') {
      setForm(prev => ({ ...prev, zoningNote: '' }));
    }
  };

  const handleNewOwnerChange = (field, value) => {
    setNewOwner(prev => ({ ...prev, [field]: value }));
    
    const errorKey = `newOwner${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (ownerValidationErrors[errorKey]) {
      setOwnerValidationErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const handleNewRefChange = (field, value) => {
    setNewRef(prev => ({ ...prev, [field]: value }));
    
    const errorKey = `newRef${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (refValidationErrors[errorKey]) {
      setRefValidationErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const handleOwnerSelectionChange = (e) => {
    const newSelection = e.target.value;
    setOwnerSelection(newSelection);
    
    if (newSelection === 'new') {
      setSelectedOwner('');
      setSelectedOwnerId('');
    }
  };

  const handleRefSelectionChange = (e) => {
    const newSelection = e.target.value;
    setRefSelection(newSelection);
    
    if (newSelection === 'new') {
      setSelectedRef('');
      setSelectedRefId('');
    }
  };

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone format
  const isValidPhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Check if email/phone already exists in database
  const checkClientExists = async (email, phone) => {
    try {
      const response = await apiService.getClients({ 
        search: email,
        limit: 1000 
      });
      
      const emailExists = response.clients.some(client => 
        client.email.toLowerCase() === email.toLowerCase()
      );
      
      const phoneExists = response.clients.some(client => 
        client.phone.replace(/\s/g, '') === phone.replace(/\s/g, '')
      );
      
      return { emailExists, phoneExists };
    } catch (error) {
      console.error('Error checking client existence:', error);
      return { emailExists: false, phoneExists: false };
    }
  };

  // Validate new owner
  const validateNewOwner = async () => {
    const errors = {};
    
    if (!newOwner.name || newOwner.name.trim().length < 2) {
      errors.newOwnerName = 'Name must be at least 2 characters';
    }
    
    if (!newOwner.email || !isValidEmail(newOwner.email)) {
      errors.newOwnerEmail = 'Please enter a valid email address';
    }
    
    if (!newOwner.phone || !isValidPhone(newOwner.phone)) {
      errors.newOwnerPhone = 'Please enter a valid phone number';
    }
    
    // Check database for existing email/phone
    if (newOwner.email && isValidEmail(newOwner.email)) {
      setValidatingOwner(true);
      const { emailExists, phoneExists } = await checkClientExists(newOwner.email, newOwner.phone);
      
      if (emailExists) {
        errors.newOwnerEmail = 'A client with this email already exists';
      }
      
      if (phoneExists) {
        errors.newOwnerPhone = 'A client with this phone number already exists';
      }
      setValidatingOwner(false);
    }
    
    setOwnerValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate new ref
  const validateNewRef = async () => {
    const errors = {};
    
    if (!newRef.name || newRef.name.trim().length < 2) {
      errors.newRefName = 'Name must be at least 2 characters';
    }
    
    if (!newRef.email || !isValidEmail(newRef.email)) {
      errors.newRefEmail = 'Please enter a valid email address';
    }
    
    if (!newRef.phone || !isValidPhone(newRef.phone)) {
      errors.newRefPhone = 'Please enter a valid phone number';
    }
    
    // Check database for existing email/phone
    if (newRef.email && isValidEmail(newRef.email)) {
      setValidatingRef(true);
      const { emailExists, phoneExists } = await checkClientExists(newRef.email, newRef.phone);
      
      if (emailExists) {
        errors.newRefEmail = 'A client with this email already exists';
      }
      
      if (phoneExists) {
        errors.newRefPhone = 'A client with this phone number already exists';
      }
      setValidatingRef(false);
    }
    
    setRefValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add new owner to database
  const handleAddNewOwner = async () => {
    if (await validateNewOwner()) {
      try {
        setValidatingOwner(true);
        const response = await apiService.createClient(newOwner);
        
        // Update the clients list
        await loadExistingClients();
        
        // Set the new owner as selected
        setSelectedOwner(response.client.name);
        setSelectedOwnerId(response.client._id);
        setOwnerSelection('existing');
        
        // Reset form
        setNewOwner({ 
          name: '', 
          email: '', 
          phone: '', 
          address: '',
          type: 'individual',
          leadSource: 'other'
        });
        setOwnerValidationErrors({});
        
        alert('New owner added successfully!');
      } catch (error) {
        alert('Error adding new owner: ' + error.message);
      } finally {
        setValidatingOwner(false);
      }
    }
  };

  // Add new ref to database
  const handleAddNewRef = async () => {
    if (await validateNewRef()) {
      try {
        setValidatingRef(true);
        const response = await apiService.createClient(newRef);
        
        // Update the clients list
        await loadExistingClients();
        
        // Set the new ref as selected
        setSelectedRef(response.client.name);
        setSelectedRefId(response.client._id);
        setRefSelection('existing');
        
        // Reset form
        setNewRef({ 
          name: '', 
          email: '', 
          phone: '', 
          address: '',
          type: 'individual',
          leadSource: 'other'
        });
        setRefValidationErrors({});
        
        alert('New reference added successfully!');
      } catch (error) {
        alert('Error adding new reference: ' + error.message);
      } finally {
        setValidatingRef(false);
      }
    }
  };

  // Validate property form
  const validatePropertyForm = () => {
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

    if (form.area) {
      const areaNum = parseFloat(form.area);
      if (isNaN(areaNum) || areaNum <= 0) {
        newErrors.area = 'Area must be a positive number';
      } else if (areaNum > 1000000) {
        newErrors.area = 'Area seems too large. Please check the value';
      }
    }

    if (form.perSqFtRate) {
      const rateNum = parseFloat(form.perSqFtRate);
      if (isNaN(rateNum) || rateNum <= 0) {
        newErrors.perSqFtRate = 'Rate must be a positive number';
      } else if (rateNum > 100000) {
        newErrors.perSqFtRate = 'Rate seems too high. Please check the value';
      }
    }

    if (form.ageYear && (isNaN(form.ageYear) || form.ageYear < 1900 || form.ageYear > 2024)) {
      newErrors.ageYear = 'Please enter a valid year between 1900 and 2024';
    }

    if (form.zoning === 'Mixed Use' && (!form.zoningNote || form.zoningNote.trim().length < 5)) {
      newErrors.zoningNote = 'Please specify the mixed use details (at least 5 characters)';
    }

    if (form.notes && form.notes.trim().length > 1000) {
      newErrors.notes = 'Notes must be less than 1000 characters';
    }

    if (form.additionalNotes && form.additionalNotes.trim().length > 1000) {
      newErrors.additionalNotes = 'Additional notes must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate owner step
  const validateOwnerStep = () => {
    if (ownerSelection === 'existing' && !selectedOwnerId) {
      setErrors(prev => ({ ...prev, owner: 'Please select an owner' }));
      return false;
    }
    if (ownerSelection === 'new') {
      if (!newOwner.name || newOwner.name.trim().length < 2) {
        setErrors(prev => ({ ...prev, owner: 'Please complete owner details' }));
        return false;
      }
    }
    return true;
  };

  // Validate reference step
  const validateReferenceStep = () => {
    if (refSelection === 'existing' && !selectedRefId) {
      setErrors(prev => ({ ...prev, ref: 'Please select a reference' }));
      return false;
    }
    if (refSelection === 'new') {
      if (!newRef.name || newRef.name.trim().length < 2) {
        setErrors(prev => ({ ...prev, ref: 'Please complete reference details' }));
        return false;
      }
    }
    return true;
  };

  // Handle step completion
  const handleNext = async () => {
    if (activeStep === 0) {
      // Owner step
      if (ownerSelection === 'new') {
        if (!(await validateNewOwner())) {
          setShowOwnerDialog(true);
          return;
        }
      }
      
      if (validateOwnerStep()) {
        setActiveStep(1);
        setStepsCompleted(prev => ({ ...prev, owner: true }));
      }
    } else if (activeStep === 1) {
      // Property step
      if (validatePropertyForm()) {
        setActiveStep(2);
        setStepsCompleted(prev => ({ ...prev, property: true }));
      }
    } else if (activeStep === 2) {
      // Reference step
      if (refSelection === 'new') {
        if (!(await validateNewRef())) {
          setShowRefDialog(true);
          return;
        }
      }
      
      if (validateReferenceStep()) {
        setStepsCompleted(prev => ({ ...prev, reference: true }));
        await submitProperty();
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setStepsCompleted({
      owner: false,
      property: false,
      reference: false
    });
  };

  const submitProperty = async () => {
    try {
      setSubmitting(true);
      
      // First, add new owner/ref if needed
      let finalOwnerId = selectedOwnerId;
      let finalRefId = selectedRefId;

      if (ownerSelection === 'new') {
        const ownerResponse = await apiService.createClient(newOwner);
        finalOwnerId = ownerResponse.client._id;
      }

      if (refSelection === 'new') {
        const refResponse = await apiService.createClient(newRef);
        finalRefId = refResponse.client._id;
      }

      // Upload files to Google Drive
      const uploadedFiles = [];
      
      if (files.length > 0) {
        alert('Uploading files to Google Drive... Please wait.');
        
        for (let i = 0; i < files.length; i++) {
          const fileObj = files[i];
          
          try {
            if (!fileObj.uploaded) {
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
            } else {
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
            return;
          }
        }
      }

      // Prepare property data
      const propertyData = {
        ...form,
        owner: finalOwnerId,
        ref: finalRefId,
        files: uploadedFiles.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
          originalSize: file.originalSize,
          driveId: file.driveId,
          driveUrl: file.driveUrl,
          compressionRatio: Math.max(0, file.compressionRatio || 0)
        })),
        totalPrice: totalPrice,
        createdAt: new Date().toISOString()
      };

      // Clean up age fields
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
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      label: 'Owner Information',
      description: 'Select or add the property owner'
    },
    {
      label: 'Property Details',
      description: 'Enter property information and pricing'
    },
    {
      label: 'Reference (Optional)',
      description: 'Add a reference contact for this property'
    }
  ];

  if (loading && isEditing) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 3.5 }, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              Loading property data...
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3.5 }, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main', textAlign: 'center' }}>
          {isEditing ? '✏️ Edit Property' : '🏠 Add New Property'}
        </Typography>
        
        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                optional={
                  index === 2 ? (
                    <Typography variant="caption">Optional</Typography>
                  ) : null
                }
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <Typography>{step.description}</Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        <form>
          <Stack spacing={3}>
            {/* Step 1: Owner Information */}
            {activeStep === 0 && (
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                    👤 Owner Information *
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControl component="fieldset" error={!!errors.owner}>
                        <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
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
                            label="Select from existing clients" 
                          />
                          <FormControlLabel 
                            value="new" 
                            control={<Radio />} 
                            label="Add new client" 
                          />
                        </RadioGroup>
                      </FormControl>
                    </Grid>

                    {ownerSelection === 'existing' && (
                      <Grid item xs={12}>
                        <FormControl fullWidth error={!!errors.owner} required size="medium">
                          <InputLabel>Select Owner *</InputLabel>
                          <Select
                            value={selectedOwnerId}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              setSelectedOwnerId(selectedId);
                              const selectedClient = existingClients.find(client => client._id === selectedId);
                              setSelectedOwner(selectedClient ? selectedClient.name : '');
                            }}
                            label="Select Owner *"
                            disabled={loadingClients}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  minWidth: '400px',
                                  maxHeight: '300px'
                                }
                              }
                            }}
                          >
                            {existingClients.map(client => (
                              <MenuItem key={client._id} value={client._id}>
                                {client.name} ({client.email}) - {client.phone}
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
                        <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
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
                                error={!!ownerValidationErrors.newOwnerName}
                                helperText={ownerValidationErrors.newOwnerName}
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
                                error={!!ownerValidationErrors.newOwnerEmail}
                                helperText={ownerValidationErrors.newOwnerEmail}
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
                                error={!!ownerValidationErrors.newOwnerPhone}
                                helperText={ownerValidationErrors.newOwnerPhone}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                label="Address"
                                value={newOwner.address}
                                onChange={(e) => handleNewOwnerChange('address', e.target.value)}
                                fullWidth
                                size="medium"
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Property Details */}
            {activeStep === 1 && (
              <>
                {/* Basic Information */}
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                      �� Basic Information
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
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={!!errors.city} required size="medium">
                          <InputLabel>City *</InputLabel>
                          <Select
                            name="city"
                            value={form.city}
                            onChange={handleChange}
                            label="City *"
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  minWidth: '300px'
                                }
                              }
                            }}
                          >
                            {cities.map(city => (
                              <MenuItem key={city} value={city}>{city}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="medium">
                          <InputLabel>Zoning</InputLabel>
                          <Select
                            name="zoning"
                            value={form.zoning}
                            onChange={handleChange}
                            label="Zoning"
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  minWidth: '300px'
                                }
                              }
                            }}
                          >
                            {zoningTypes.map(zone => (
                              <MenuItem key={zone} value={zone}>{zone}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

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
                          />
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>

                {/* Property Details */}
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                      🏠 Property Details
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="medium">
                          <InputLabel>Furnishing</InputLabel>
                          <Select
                            name="furnishing"
                            value={form.furnishing}
                            onChange={handleChange}
                            label="Furnishing"
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  minWidth: '300px'
                                }
                              }
                            }}
                          >
                            {furnishingOptions.map(option => (
                              <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required error={!!errors.type} size="medium">
                          <InputLabel>Property Type *</InputLabel>
                          <Select
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            label="Property Type *"
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  minWidth: '300px'
                                }
                              }
                            }}
                          >
                            {propertyTypes.map(type => (
                              <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="medium">
                          <InputLabel>Age - Year</InputLabel>
                          <Select
                            name="ageYear"
                            value={form.ageYear}
                            onChange={handleChange}
                            label="Age - Year"
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  minWidth: '300px'
                                }
                              }
                            }}
                          >
                            {years.map(year => (
                              <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="medium">
                          <InputLabel>Age - Month</InputLabel>
                          <Select
                            name="ageMonth"
                            value={form.ageMonth}
                            onChange={handleChange}
                            label="Age - Month"
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  minWidth: '300px'
                                }
                              }
                            }}
                          >
                            {months.map(month => (
                              <MenuItem key={month} value={month}>{month}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
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
                        />
                      </Grid>

                      {totalPrice && (
                        <Grid item xs={12}>
                          <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
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

                {/* Status & Notes */}
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                      📝 Status & Notes
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={!!errors.status} required size="medium">
                          <InputLabel>Status *</InputLabel>
                          <Select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            label="Status *"
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  minWidth: '300px'
                                }
                              }
                            }}
                          >
                            {statusOptions.map(status => (
                              <MenuItem key={status} value={status}>{status}</MenuItem>
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
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Photos & Videos */}
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <FileUpload 
                      files={files}
                      setFiles={setFiles}
                      maxFiles={10}
                      maxSizeMB={10}
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {/* Step 3: Reference Selection */}
            {activeStep === 2 && (
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                    📞 Reference Selection (Optional)
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControl component="fieldset" error={!!errors.ref}>
                        <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
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
                            label="Select from existing clients" 
                          />
                          <FormControlLabel 
                            value="new" 
                            control={<Radio />} 
                            label="Add new client" 
                          />
                        </RadioGroup>
                      </FormControl>
                    </Grid>

                    {refSelection === 'existing' && (
                      <Grid item xs={12}>
                        <FormControl fullWidth error={!!errors.ref} size="medium">
                          <InputLabel>Select Reference</InputLabel>
                          <Select
                            value={selectedRefId}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              setSelectedRefId(selectedId);
                              const selectedClient = existingClients.find(client => client._id === selectedId);
                              setSelectedRef(selectedClient ? selectedClient.name : '');
                            }}
                            label="Select Reference"
                            disabled={loadingClients}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  minWidth: '400px',
                                  maxHeight: '300px'
                                }
                              }
                            }}
                          >
                            {existingClients.map(client => (
                              <MenuItem key={client._id} value={client._id}>
                                {client.name} ({client.email}) - {client.phone}
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
                        <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
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
                                error={!!refValidationErrors.newRefName}
                                helperText={refValidationErrors.newRefName}
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
                                error={!!refValidationErrors.newRefEmail}
                                helperText={refValidationErrors.newRefEmail}
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
                                error={!!refValidationErrors.newRefPhone}
                                helperText={refValidationErrors.newRefPhone}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                label="Address"
                                value={newRef.address}
                                onChange={(e) => handleNewRefChange('address', e.target.value)}
                                fullWidth
                                size="medium"
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={submitting || loadingClients}
                  sx={{ mr: 1 }}
                >
                  {submitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Saving...
                    </>
                  ) : activeStep === steps.length - 1 ? (
                    isEditing ? 'Update Property' : 'Add Property'
                  ) : (
                    'Next'
                  )}
                </Button>
                <Button
                  onClick={() => navigate('/properties')}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Stack>
        </form>
      </Paper>

      {/* Owner Validation Dialog */}
      <Dialog open={showOwnerDialog} onClose={() => setShowOwnerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Owner Details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please complete the owner details before proceeding. The following fields need to be corrected:
          </Typography>
          {Object.keys(ownerValidationErrors).map(key => (
            <Typography key={key} color="error" variant="body2" sx={{ mb: 1 }}>
              • {ownerValidationErrors[key]}
            </Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOwnerDialog(false)}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Ref Validation Dialog */}
      <Dialog open={showRefDialog} onClose={() => setShowRefDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Reference Details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please complete the reference details before proceeding. The following fields need to be corrected:
          </Typography>
          {Object.keys(refValidationErrors).map(key => (
            <Typography key={key} color="error" variant="body2" sx={{ mb: 1 }}>
              • {refValidationErrors[key]}
            </Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRefDialog(false)}>OK</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AddProperty;
