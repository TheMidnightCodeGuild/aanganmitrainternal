const express = require('express');
const { body, validationResult } = require('express-validator');
const ClientRole = require('../models/clientRole');
const Client = require('../models/client');
const Property = require('../models/property');
const User = require('../models/user');

const router = express.Router();

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// @route   GET /api/client-roles
// @desc    Get all client roles with filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      clientId,
      propertyId,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (clientId) filter.clientId = clientId;
    if (propertyId) filter.propertyId = propertyId;
    if (assignedTo) filter.assignedTo = assignedTo;
    
    // Search functionality
    if (search) {
      // Search in client name, email, phone
      const clients = await Client.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      filter.clientId = { $in: clients.map(c => c._id) };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const clientRoles = await ClientRole.find(filter)
      .populate('clientId', 'name email phone type status')
      .populate('propertyId', 'title location price')
      .populate('assignedTo', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ClientRole.countDocuments(filter);

    res.json({
      clientRoles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRoles: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get client roles error:', error);
    res.status(500).json({ message: 'Server error while fetching client roles' });
  }
});

// @route   GET /api/client-roles/:id
// @desc    Get single client role by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const clientRole = await ClientRole.findById(req.params.id)
      .populate('clientId', 'name email phone type status location')
      .populate('propertyId', 'title location price description')
      .populate('assignedTo', 'name email phone');

    if (!clientRole) {
      return res.status(404).json({ message: 'Client role not found' });
    }

    res.json({ clientRole });

  } catch (error) {
    console.error('Get client role error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Client role not found' });
    }
    res.status(500).json({ message: 'Server error while fetching client role' });
  }
});

// @route   POST /api/client-roles
// @desc    Create a new client role
// @access  Private
router.post('/', auth, [
  body('clientId').isMongoId().withMessage('Valid client ID is required'),
  body('role').isIn(['buyer', 'seller', 'referrer']).withMessage('Invalid role'),
  body('propertyId').optional().isMongoId().withMessage('Invalid property ID'),
  body('status').optional().isIn(['active', 'inactive', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('commission.type').optional().isIn(['fixed', 'percentage']).withMessage('Invalid commission type'),
  body('commission.value').optional().isNumeric().withMessage('Commission value must be a number'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assigned user ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      clientId,
      role,
      propertyId,
      status,
      commission,
      relationshipNote,
      notes,
      assignedTo
    } = req.body;

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Verify property exists if provided
    if (propertyId) {
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
    }

    // Check if role already exists for this client-property combination
    const existingRole = await ClientRole.findOne({
      clientId,
      role,
      propertyId: propertyId || null
    });

    if (existingRole) {
      return res.status(400).json({ 
        message: `Client already has ${role} role for this property` 
      });
    }

    // Create new client role
    const clientRole = new ClientRole({
      clientId,
      role,
      propertyId,
      status: status || 'active',
      commission: commission || { type: 'fixed', value: 0, currency: 'INR' },
      relationshipNote,
      notes,
      assignedTo: assignedTo || req.user._id
    });

    await clientRole.save();

    // Populate references
    await clientRole.populate('clientId', 'name email phone type status');
    await clientRole.populate('propertyId', 'title location price');
    await clientRole.populate('assignedTo', 'name email');

    res.status(201).json({
      message: 'Client role created successfully',
      clientRole
    });

  } catch (error) {
    console.error('Create client role error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Client role already exists for this combination' 
      });
    }
    res.status(500).json({ message: 'Server error while creating client role' });
  }
});

// @route   PUT /api/client-roles/:id
// @desc    Update a client role
// @access  Private
router.put('/:id', auth, [
  body('status').optional().isIn(['active', 'inactive', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('commission.type').optional().isIn(['fixed', 'percentage']).withMessage('Invalid commission type'),
  body('commission.value').optional().isNumeric().withMessage('Commission value must be a number'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assigned user ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const clientRole = await ClientRole.findById(req.params.id);
    if (!clientRole) {
      return res.status(404).json({ message: 'Client role not found' });
    }

    // Update client role fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'clientId' && key !== 'role' && key !== 'propertyId') {
        clientRole[key] = req.body[key];
      }
    });

    await clientRole.save();

    // Populate references
    await clientRole.populate('clientId', 'name email phone type status');
    await clientRole.populate('propertyId', 'title location price');
    await clientRole.populate('assignedTo', 'name email');

    res.json({
      message: 'Client role updated successfully',
      clientRole
    });

  } catch (error) {
    console.error('Update client role error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Client role not found' });
    }
    res.status(500).json({ message: 'Server error while updating client role' });
  }
});

// @route   DELETE /api/client-roles/:id
// @desc    Delete a client role
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const clientRole = await ClientRole.findById(req.params.id);
    
    if (!clientRole) {
      return res.status(404).json({ message: 'Client role not found' });
    }

    await clientRole.deleteOne();

    res.json({ message: 'Client role deleted successfully' });

  } catch (error) {
    console.error('Delete client role error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Client role not found' });
    }
    res.status(500).json({ message: 'Server error while deleting client role' });
  }
});

// @route   GET /api/client-roles/client/:clientId
// @desc    Get all roles for a specific client
// @access  Private
router.get('/client/:clientId', auth, async (req, res) => {
  try {
    const clientRoles = await ClientRole.find({ clientId: req.params.clientId })
      .populate('propertyId', 'title location price')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ clientRoles });

  } catch (error) {
    console.error('Get client roles error:', error);
    res.status(500).json({ message: 'Server error while fetching client roles' });
  }
});

// @route   GET /api/client-roles/property/:propertyId
// @desc    Get all roles for a specific property
// @access  Private
router.get('/property/:propertyId', auth, async (req, res) => {
  try {
    const clientRoles = await ClientRole.find({ propertyId: req.params.propertyId })
      .populate('clientId', 'name email phone type status')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ clientRoles });

  } catch (error) {
    console.error('Get property roles error:', error);
    res.status(500).json({ message: 'Server error while fetching property roles' });
  }
});

module.exports = router; 