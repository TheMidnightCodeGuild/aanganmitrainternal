const express = require('express');
const { body, validationResult } = require('express-validator');
const Referral = require('../models/referral');
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

// @route   GET /api/referrals
// @desc    Get all referrals with filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      commissionStatus,
      referredByClientId,
      referredType,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (commissionStatus) filter.commissionStatus = commissionStatus;
    if (referredByClientId) filter.referredByClientId = referredByClientId;
    if (referredType) filter.referredType = referredType;
    if (assignedTo) filter.assignedTo = assignedTo;
    
    // Search functionality
    if (search) {
      // Search in referrer client name, email, phone
      const referrers = await Client.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      filter.referredByClientId = { $in: referrers.map(c => c._id) };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const referrals = await Referral.find(filter)
      .populate('referredByClientId', 'name email phone type status')
      .populate('referredClientId', 'name email phone type status')
      .populate('referredPropertyId', 'title location price')
      .populate('assignedTo', 'name email')
      .populate('parentReferralId', 'referredByClientId')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Referral.countDocuments(filter);

    res.json({
      referrals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReferrals: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ message: 'Server error while fetching referrals' });
  }
});

// @route   GET /api/referrals/:id
// @desc    Get single referral by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id)
      .populate('referredByClientId', 'name email phone type status location')
      .populate('referredClientId', 'name email phone type status location')
      .populate('referredPropertyId', 'title location price description')
      .populate('assignedTo', 'name email phone')
      .populate('parentReferralId', 'referredByClientId referredType');

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    res.json({ referral });

  } catch (error) {
    console.error('Get referral error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Referral not found' });
    }
    res.status(500).json({ message: 'Server error while fetching referral' });
  }
});

// @route   POST /api/referrals
// @desc    Create a new referral
// @access  Private
router.post('/', auth, [
  body('referredByClientId').isMongoId().withMessage('Valid referrer client ID is required'),
  body('referredType').isIn(['client', 'property']).withMessage('Invalid referred type'),
  body('referredClientId').optional().isMongoId().withMessage('Invalid referred client ID'),
  body('referredPropertyId').optional().isMongoId().withMessage('Invalid referred property ID'),
  body('commission.type').isIn(['fixed', 'percentage']).withMessage('Invalid commission type'),
  body('commission.value').isNumeric().withMessage('Commission value must be a number'),
  body('commission.promised').isNumeric().withMessage('Promised commission must be a number'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assigned user ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      referredByClientId,
      referredType,
      referredClientId,
      referredPropertyId,
      commission,
      notes,
      parentReferralId,
      assignedTo
    } = req.body;

    // Verify referrer client exists
    const referrerClient = await Client.findById(referredByClientId);
    if (!referrerClient) {
      return res.status(404).json({ message: 'Referrer client not found' });
    }

    // Verify referred client/property exists
    if (referredType === 'client') {
      if (!referredClientId) {
        return res.status(400).json({ message: 'Referred client ID is required' });
      }
      const referredClient = await Client.findById(referredClientId);
      if (!referredClient) {
        return res.status(404).json({ message: 'Referred client not found' });
      }
    } else if (referredType === 'property') {
      if (!referredPropertyId) {
        return res.status(400).json({ message: 'Referred property ID is required' });
      }
      const referredProperty = await Property.findById(referredPropertyId);
      if (!referredProperty) {
        return res.status(404).json({ message: 'Referred property not found' });
      }
    }

    // Handle referral chain
    let chainLevel = 1;
    if (parentReferralId) {
      const parentReferral = await Referral.findById(parentReferralId);
      if (!parentReferral) {
        return res.status(404).json({ message: 'Parent referral not found' });
      }
      chainLevel = parentReferral.chainLevel + 1;
    }

    // Create new referral
    const referral = new Referral({
      referredByClientId,
      referredType,
      referredClientId,
      referredPropertyId,
      commission: {
        ...commission,
        paid: 0,
        currency: commission.currency || 'INR'
      },
      notes,
      parentReferralId,
      chainLevel,
      assignedTo: assignedTo || req.user._id
    });

    await referral.save();

    // Populate references
    await referral.populate('referredByClientId', 'name email phone type status');
    await referral.populate('referredClientId', 'name email phone type status');
    await referral.populate('referredPropertyId', 'title location price');
    await referral.populate('assignedTo', 'name email');

    res.status(201).json({
      message: 'Referral created successfully',
      referral
    });

  } catch (error) {
    console.error('Create referral error:', error);
    res.status(500).json({ message: 'Server error while creating referral' });
  }
});

// @route   PUT /api/referrals/:id
// @desc    Update a referral
// @access  Private
router.put('/:id', auth, [
  body('status').optional().isIn(['active', 'converted', 'expired', 'cancelled']).withMessage('Invalid status'),
  body('commissionStatus').optional().isIn(['pending', 'partial', 'paid', 'cancelled']).withMessage('Invalid commission status'),
  body('commission.paid').optional().isNumeric().withMessage('Paid commission must be a number'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assigned user ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const referral = await Referral.findById(req.params.id);
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Update referral fields
    Object.keys(req.body).forEach(key => {
      if (key === 'commission' && req.body.commission) {
        // Merge commission object
        referral.commission = { ...referral.commission, ...req.body.commission };
      } else if (key !== 'referredByClientId' && key !== 'referredType' && 
                 key !== 'referredClientId' && key !== 'referredPropertyId') {
        referral[key] = req.body[key];
      }
    });

    // Update timestamps for status changes
    if (req.body.status === 'converted' && referral.status !== 'converted') {
      referral.convertedAt = new Date();
    }
    if (req.body.commissionStatus === 'paid' && referral.commissionStatus !== 'paid') {
      referral.paidAt = new Date();
    }

    await referral.save();

    // Populate references
    await referral.populate('referredByClientId', 'name email phone type status');
    await referral.populate('referredClientId', 'name email phone type status');
    await referral.populate('referredPropertyId', 'title location price');
    await referral.populate('assignedTo', 'name email');

    res.json({
      message: 'Referral updated successfully',
      referral
    });

  } catch (error) {
    console.error('Update referral error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Referral not found' });
    }
    res.status(500).json({ message: 'Server error while updating referral' });
  }
});

// @route   DELETE /api/referrals/:id
// @desc    Delete a referral
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);
    
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    await referral.deleteOne();

    res.json({ message: 'Referral deleted successfully' });

  } catch (error) {
    console.error('Delete referral error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Referral not found' });
    }
    res.status(500).json({ message: 'Server error while deleting referral' });
  }
});

// @route   GET /api/referrals/client/:clientId
// @desc    Get all referrals by a specific client
// @access  Private
router.get('/client/:clientId', auth, async (req, res) => {
  try {
    const referrals = await Referral.find({ referredByClientId: req.params.clientId })
      .populate('referredClientId', 'name email phone type status')
      .populate('referredPropertyId', 'title location price')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ referrals });

  } catch (error) {
    console.error('Get client referrals error:', error);
    res.status(500).json({ message: 'Server error while fetching client referrals' });
  }
});

// @route   GET /api/referrals/stats/overview
// @desc    Get referral statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Referral.aggregate([
      {
        $group: {
          _id: null,
          totalReferrals: { $sum: 1 },
          activeReferrals: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          convertedReferrals: {
            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
          },
          totalCommissionPromised: { $sum: '$commission.promised' },
          totalCommissionPaid: { $sum: '$commission.paid' }
        }
      }
    ]);

    const statusStats = await Referral.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const commissionStatusStats = await Referral.aggregate([
      {
        $group: {
          _id: '$commissionStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await Referral.aggregate([
      {
        $group: {
          _id: '$referredType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: stats[0] || {
        totalReferrals: 0,
        activeReferrals: 0,
        convertedReferrals: 0,
        totalCommissionPromised: 0,
        totalCommissionPaid: 0
      },
      byStatus: statusStats,
      byCommissionStatus: commissionStatusStats,
      byType: typeStats
    });

  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ message: 'Server error while fetching referral statistics' });
  }
});

module.exports = router; 