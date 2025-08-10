const express = require('express');
const { body, validationResult } = require('express-validator');
const Client = require('../models/client');
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

// @route   GET /api/clients
// @desc    Get all clients with filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      search,
      assignedTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const clients = await Client.find(filter)
      .populate('assignedTo', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Client.countDocuments(filter);

    res.json({
      clients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalClients: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Server error while fetching clients' });
  }
});

// @route   POST /api/clients/check-duplicates
// @desc    Check for duplicate email and phone
// @access  Private
router.post('/check-duplicates', auth, [
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('phone').optional().trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
  body('excludeId').optional().isMongoId().withMessage('Invalid client ID for exclusion')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, phone, excludeId } = req.body;
    const duplicates = {};

    // Check for email duplicates
    if (email) {
      const emailFilter = { email };
      if (excludeId) {
        emailFilter._id = { $ne: excludeId };
      }
      const existingEmail = await Client.findOne(emailFilter);
      if (existingEmail) {
        duplicates.email = {
          exists: true,
          clientId: existingEmail._id,
          clientName: existingEmail.name
        };
      } else {
        duplicates.email = { exists: false };
      }
    }

    // Check for phone duplicates
    if (phone) {
      const phoneFilter = { phone };
      if (excludeId) {
        phoneFilter._id = { $ne: excludeId };
      }
      const existingPhone = await Client.findOne(phoneFilter);
      if (existingPhone) {
        duplicates.phone = {
          exists: true,
          clientId: existingPhone._id,
          clientName: existingPhone.name
        };
      } else {
        duplicates.phone = { exists: false };
      }
    }

    res.json({
      duplicates,
      hasDuplicates: Object.values(duplicates).some(dup => dup.exists)
    });

  } catch (error) {
    console.error('Check duplicates error:', error);
    res.status(500).json({ message: 'Server error while checking duplicates' });
  }
});

// @route   GET /api/clients/:id
// @desc    Get single client by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('assignedTo', 'name email phone');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ client });

  } catch (error) {
    console.error('Get client error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(500).json({ message: 'Server error while fetching client' });
  }
});

// @route   POST /api/clients
// @desc    Create a new client
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('phone').trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
  body('type').isIn(['individual', 'broker', 'agency']).withMessage('Invalid client type'),
  body('leadSource').optional().isIn(['website', 'walk-in', 'instagram', 'facebook', 'referral', 'google', 'other']).withMessage('Invalid lead source'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assigned user ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      email,
      phone,
      address,
      type,
      location,
      leadSource,
      tags,
      preferences,
      notes,
      assignedTo
    } = req.body;

    // Check if client already exists with same email
    const existingClientByEmail = await Client.findOne({ email });
    if (existingClientByEmail) {
      return res.status(400).json({ 
        message: 'A client with this email already exists' 
      });
    }

    // Check if client already exists with same phone
    const existingClientByPhone = await Client.findOne({ phone });
    if (existingClientByPhone) {
      return res.status(400).json({ 
        message: 'A client with this phone number already exists' 
      });
    }

    // Create new client (status will be automatically set to 'active' by default)
    const client = new Client({
      name,
      email,
      phone,
      address,
      type,
      status: 'active', // Always active when created
      preferences,
      notes,
      leadSource: leadSource || 'other',
      assignedTo: assignedTo || req.user._id
    });

    await client.save();

    // Populate assignedTo field
    await client.populate('assignedTo', 'name email');

    res.status(201).json({
      message: 'Client created successfully',
      client
    });

  } catch (error) {
    console.error('Create client error:', error);
    if (error.code === 11000) {
      // Check which field caused the duplicate key error
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ 
          message: 'A client with this email already exists' 
        });
      }
      if (error.keyPattern && error.keyPattern.phone) {
        return res.status(400).json({ 
          message: 'A client with this phone number already exists' 
        });
      }
      return res.status(400).json({ 
        message: 'A client with this information already exists' 
      });
    }
    res.status(500).json({ message: 'Server error while creating client' });
  }
});

// @route   PUT /api/clients/:id
// @desc    Update a client
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('phone').optional().trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
  body('type').optional().isIn(['individual', 'broker', 'agency']).withMessage('Invalid client type'),
  body('leadSource').optional().isIn(['website', 'walk-in', 'instagram', 'facebook', 'referral', 'google', 'other']).withMessage('Invalid lead source'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assigned user ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if email already exists (excluding current client)
    if (req.body.email) {
      const existingClientByEmail = await Client.findOne({
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      if (existingClientByEmail) {
        return res.status(400).json({ 
          message: 'A client with this email already exists' 
        });
      }
    }

    // Check if phone already exists (excluding current client)
    if (req.body.phone) {
      const existingClientByPhone = await Client.findOne({
        phone: req.body.phone,
        _id: { $ne: req.params.id }
      });
      if (existingClientByPhone) {
        return res.status(400).json({ 
          message: 'A client with this phone number already exists' 
        });
      }
    }

    // Update client fields (excluding status which is managed automatically)
    Object.keys(req.body).forEach(key => {
      if (key !== 'files' && key !== 'owner' && key !== 'ref' && key !== 'status') {
        client[key] = req.body[key];
      }
    });

    await client.save();
    await client.populate('assignedTo', 'name email');

    res.json({
      message: 'Client updated successfully',
      client
    });

  } catch (error) {
    console.error('Update client error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Client not found' });
    }
    if (error.code === 11000) {
      // Check which field caused the duplicate key error
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ 
          message: 'A client with this email already exists' 
        });
      }
      if (error.keyPattern && error.keyPattern.phone) {
        return res.status(400).json({ 
          message: 'A client with this phone number already exists' 
        });
      }
      return res.status(400).json({ 
        message: 'A client with this information already exists' 
      });
    }
    res.status(500).json({ message: 'Server error while updating client' });
  }
});

// @route   DELETE /api/clients/:id
// @desc    Delete a client
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    await client.deleteOne();

    res.json({ message: 'Client deleted successfully' });

  } catch (error) {
    console.error('Delete client error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(500).json({ message: 'Server error while deleting client' });
  }
});

// @route   GET /api/clients/stats/overview
// @desc    Get client statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Client.aggregate([
      {
        $group: {
          _id: null,
          totalClients: { $sum: 1 },
          activeClients: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          inactiveClients: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get clients with no active roles
    const activeNoRoles = await Client.countDocuments({
      status: 'active',
      $or: [
        { activeRoles: { $exists: false } },
        { activeRoles: { $size: 0 } }
      ]
    });

    const typeStats = await Client.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const sourceStats = await Client.aggregate([
      {
        $group: {
          _id: '$leadSource',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get role statistics
    const roleStats = await Client.aggregate([
      {
        $unwind: {
          path: '$activeRoles',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$activeRoles',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: { $ne: null }
        }
      }
    ]);

    res.json({
      overview: {
        ...stats[0],
        activeNoRoles
      } || {
        totalClients: 0,
        activeClients: 0,
        inactiveClients: 0,
        activeNoRoles: 0
      },
      byType: typeStats,
      bySource: sourceStats,
      byRole: roleStats
    });

  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({ message: 'Server error while fetching client statistics' });
  }
});

module.exports = router; 