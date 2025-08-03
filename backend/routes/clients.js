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
  body('type').isIn(['buyer', 'seller', 'reference']).withMessage('Invalid client type'),
  body('status').optional().isIn(['active', 'inactive', 'prospect', 'closed']).withMessage('Invalid status'),
  body('source').optional().isIn(['website', 'referral', 'walk-in', 'social-media', 'other']).withMessage('Invalid source'),
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
      status,
      preferences,
      notes,
      source,
      assignedTo
    } = req.body;

    // Check if client already exists with same email and type
    const existingClient = await Client.findOne({ email, type });
    if (existingClient) {
      return res.status(400).json({ 
        message: `A ${type} with this email already exists` 
      });
    }

    // Create new client
    const client = new Client({
      name,
      email,
      phone,
      address,
      type,
      status: status || 'active',
      preferences,
      notes,
      source: source || 'other',
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
      return res.status(400).json({ 
        message: 'A client with this email and type already exists' 
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
  body('type').optional().isIn(['buyer', 'seller', 'reference']).withMessage('Invalid client type'),
  body('status').optional().isIn(['active', 'inactive', 'prospect', 'closed']).withMessage('Invalid status'),
  body('source').optional().isIn(['website', 'referral', 'walk-in', 'social-media', 'other']).withMessage('Invalid source'),
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

    // Check if email and type combination already exists (excluding current client)
    if (req.body.email && req.body.type) {
      const existingClient = await Client.findOne({
        email: req.body.email,
        type: req.body.type,
        _id: { $ne: req.params.id }
      });
      if (existingClient) {
        return res.status(400).json({ 
          message: `A ${req.body.type} with this email already exists` 
        });
      }
    }

    // Update client fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'files' && key !== 'owner' && key !== 'ref') {
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
      return res.status(400).json({ 
        message: 'A client with this email and type already exists' 
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
          prospectClients: {
            $sum: { $cond: [{ $eq: ['$status', 'prospect'] }, 1, 0] }
          },
          closedClients: {
            $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
          }
        }
      }
    ]);

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
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: stats[0] || {
        totalClients: 0,
        activeClients: 0,
        prospectClients: 0,
        closedClients: 0
      },
      byType: typeStats,
      bySource: sourceStats
    });

  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({ message: 'Server error while fetching client statistics' });
  }
});

module.exports = router; 