const express = require('express');
const { body, validationResult } = require('express-validator');
const Property = require('../models/property');
const User = require('../models/user');
const Client = require('../models/client');

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

// @route   GET /api/properties
// @desc    Get all properties
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, city, type } = req.query;
    
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (type) filter.type = type;

    const properties = await Property.find(filter)
      .populate('owner', 'name email phone')
      .populate('ref', 'name email phone')
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Property.countDocuments(filter);

    res.json({
      properties,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/properties/:id
// @desc    Get property by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email phone address')
      .populate('ref', 'name email phone address')
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);

  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/properties
// @desc    Create a new property
// @access  Private
router.post('/', auth, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('address').trim().isLength({ min: 10 }).withMessage('Address must be at least 10 characters'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('zoning').isIn(['Residential', 'Commercial', 'Industrial', 'Mixed Use', 'Agricultural']).withMessage('Invalid zoning'),
  body('type').isIn(['Apartment', 'House', 'Villa', 'Office', 'Shop', 'Warehouse', 'Land']).withMessage('Invalid property type'),
  body('area').isFloat({ min: 0 }).withMessage('Area must be a positive number'),
  body('perSqFtRate').isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
  body('status').isIn(['Available', 'Under Contract', 'Sold', 'Rented', 'Off Market']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, address, city, zoning, zoningNote, furnishing, ageYear, ageMonth,
      type, area, perSqFtRate, status, notes, additionalNotes,
      ownerType, owner, refType, ref, files
    } = req.body;

    // Calculate total price
    const totalPrice = area * perSqFtRate;

    // Handle owner (existing or new)
    let ownerId = null;
    if (ownerType === 'existing') {
      ownerId = owner;
    } else if (ownerType === 'new') {
      // Create new client as owner
      const newClient = new Client({
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        address: owner.address,
        type: 'seller'
      });
      await newClient.save();
      ownerId = newClient._id;
    }

    // Handle reference (existing or new)
    let refId = null;
    if (refType === 'existing' && ref) {
      refId = ref;
    } else if (refType === 'new' && ref) {
      // Create new client as reference
      const newRefClient = new Client({
        name: ref.name,
        email: ref.email,
        phone: ref.phone,
        address: ref.address,
        type: 'reference'
      });
      await newRefClient.save();
      refId = newRefClient._id;
    }

    // Create property
    const property = new Property({
      title,
      address,
      city,
      zoning,
      zoningNote: zoning === 'Mixed Use' ? zoningNote : undefined,
      furnishing,
      age: ageYear ? { year: ageYear, month: ageMonth } : undefined,
      type,
      area,
      perSqFtRate,
      totalPrice,
      status,
      notes,
      additionalNotes,
      owner: ownerId,
      ownerType,
      ref: refId,
      refType,
      files: files || [],
      createdBy: req.user._id
    });

    await property.save();

    // Populate the saved property
    const savedProperty = await Property.findById(property._id)
      .populate('owner', 'name email phone')
      .populate('ref', 'name email phone')
      .populate('createdBy', 'name');

    res.status(201).json({
      message: 'Property created successfully',
      property: savedProperty
    });

  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error creating property' });
  }
});

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Update property fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'files' && key !== 'owner' && key !== 'ref') {
        property[key] = req.body[key];
      }
    });

    // Handle files update
    if (req.body.files) {
      property.files = req.body.files;
    }

    await property.save();

    const updatedProperty = await Property.findById(property._id)
      .populate('owner', 'name email phone')
      .populate('ref', 'name email phone')
      .populate('createdBy', 'name');

    res.json({
      message: 'Property updated successfully',
      property: updatedProperty
    });

  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error updating property' });
  }
});

// @route   DELETE /api/properties/:id
// @desc    Delete property (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Soft delete
    property.isActive = false;
    await property.save();

    res.json({ message: 'Property deleted successfully' });

  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error deleting property' });
  }
});

module.exports = router; 