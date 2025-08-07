const express = require('express');
const { body, validationResult } = require('express-validator');
const Lookout = require('../models/lookout');
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

// @route   GET /api/lookouts
// @desc    Get all lookouts with filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      clientId,
      status,
      priority,
      search,
      assignedTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (clientId) filter.clientId = clientId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    
    // Search functionality
    if (search) {
      // Search in lookout title, requirements, and client name
      const clients = await Client.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { requirements: { $regex: search, $options: 'i' } },
        { clientId: { $in: clients.map(c => c._id) } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const lookouts = await Lookout.find(filter)
      .populate('clientId', 'name email phone')
      .populate('assignedTo', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Lookout.countDocuments(filter);

    res.json({
      lookouts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalLookouts: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get lookouts error:', error);
    res.status(500).json({ message: 'Server error while fetching lookouts' });
  }
});

// @route   GET /api/lookouts/:id
// @desc    Get single lookout by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const lookout = await Lookout.findById(req.params.id)
      .populate('clientId', 'name email phone address')
      .populate('assignedTo', 'name email phone');

    if (!lookout) {
      return res.status(404).json({ message: 'Lookout not found' });
    }

    res.json({ lookout });

  } catch (error) {
    console.error('Get lookout error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Lookout not found' });
    }
    res.status(500).json({ message: 'Server error while fetching lookout' });
  }
});

// @route   POST /api/lookouts
// @desc    Create a new lookout
// @access  Private
router.post('/', auth, [
  body('clientId').isMongoId().withMessage('Valid client ID is required'),
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('propertyTypes').isArray().withMessage('Property types must be an array'),
  body('cities').isArray().withMessage('Cities must be an array'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['active', 'on-hold', 'completed', 'cancelled']).withMessage('Invalid status'),
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
      title,
      propertyTypes,
      cities,
      budget,
      area,
      requirements,
      priority,
      status,
      assignedTo
    } = req.body;

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Create new lookout
    const lookout = new Lookout({
      clientId,
      title,
      propertyTypes,
      cities,
      budget,
      area,
      requirements,
      priority: priority || 'medium',
      status: status || 'active',
      assignedTo: assignedTo || req.user._id
    });

    await lookout.save();

    // Populate references
    await lookout.populate('clientId', 'name email phone');
    await lookout.populate('assignedTo', 'name email');

    res.status(201).json({
      message: 'Lookout created successfully',
      lookout
    });

  } catch (error) {
    console.error('Create lookout error:', error);
    res.status(500).json({ message: 'Server error while creating lookout' });
  }
});

// @route   PUT /api/lookouts/:id
// @desc    Update a lookout
// @access  Private
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('propertyTypes').optional().isArray().withMessage('Property types must be an array'),
  body('cities').optional().isArray().withMessage('Cities must be an array'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['active', 'on-hold', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assigned user ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const lookout = await Lookout.findById(req.params.id);
    if (!lookout) {
      return res.status(404).json({ message: 'Lookout not found' });
    }

    // Update lookout fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'clientId') {
        lookout[key] = req.body[key];
      }
    });

    await lookout.save();

    // Populate references
    await lookout.populate('clientId', 'name email phone');
    await lookout.populate('assignedTo', 'name email');

    res.json({
      message: 'Lookout updated successfully',
      lookout
    });

  } catch (error) {
    console.error('Update lookout error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Lookout not found' });
    }
    res.status(500).json({ message: 'Server error while updating lookout' });
  }
});

// @route   DELETE /api/lookouts/:id
// @desc    Delete a lookout
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const lookout = await Lookout.findById(req.params.id);
    
    if (!lookout) {
      return res.status(404).json({ message: 'Lookout not found' });
    }

    await lookout.deleteOne();

    res.json({ message: 'Lookout deleted successfully' });

  } catch (error) {
    console.error('Delete lookout error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Lookout not found' });
    }
    res.status(500).json({ message: 'Server error while deleting lookout' });
  }
});

// @route   GET /api/lookouts/client/:clientId
// @desc    Get all lookouts for a specific client
// @access  Private
router.get('/client/:clientId', auth, async (req, res) => {
  try {
    const lookouts = await Lookout.find({ clientId: req.params.clientId })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ lookouts });

  } catch (error) {
    console.error('Get client lookouts error:', error);
    res.status(500).json({ message: 'Server error while fetching client lookouts' });
  }
});

// @route   GET /api/lookouts/stats/overview
// @desc    Get lookout statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Lookout.aggregate([
      {
        $group: {
          _id: null,
          totalLookouts: { $sum: 1 },
          activeLookouts: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          onHoldLookouts: {
            $sum: { $cond: [{ $eq: ['$status', 'on-hold'] }, 1, 0] }
          },
          completedLookouts: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          urgentLookouts: {
            $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
          }
        }
      }
    ]);

    const priorityStats = await Lookout.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = await Lookout.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: stats[0] || {
        totalLookouts: 0,
        activeLookouts: 0,
        onHoldLookouts: 0,
        completedLookouts: 0,
        urgentLookouts: 0
      },
      byPriority: priorityStats,
      byStatus: statusStats
    });

  } catch (error) {
    console.error('Get lookout stats error:', error);
    res.status(500).json({ message: 'Server error while fetching lookout statistics' });
  }
});

module.exports = router; 