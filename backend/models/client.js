'use strict';
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['buyer', 'seller', 'reference'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'prospect', 'closed'],
    default: 'active'
  },
  preferences: {
    propertyTypes: [{
      type: String,
      enum: ['Apartment', 'House', 'Villa', 'Office', 'Shop', 'Warehouse', 'Land']
    }],
    cities: [String],
    budget: {
      min: Number,
      max: Number
    },
    area: {
      min: Number,
      max: Number
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'walk-in', 'social-media', 'other'],
    default: 'other'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
clientSchema.index({ type: 1, status: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ assignedTo: 1 });
clientSchema.index({ createdAt: -1 });

// Ensure unique email per type (a person can be both buyer and seller)
clientSchema.index({ email: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Client', clientSchema);