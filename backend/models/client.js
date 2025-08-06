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
  // Client type: individual, broker, agency
  type: {
    type: String,
    enum: ['individual', 'broker', 'agency'],
    required: true,
    default: 'individual'
  },
  // Client status: active, inactive, banned
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  // Location/city
  location: {
    type: String,
    trim: true
  },
  // Lead source
  leadSource: {
    type: String,
    enum: ['website', 'walk-in', 'instagram', 'facebook', 'referral', 'google', 'other'],
    default: 'other'
  },
  // Tags for categorization
  tags: [{
    type: String,
    trim: true
  }],
  // Notes about the client
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  // Preferences for property search
  preferences: {
    propertyTypes: [{
      type: String,
      enum: ['Apartment', 'House', 'Villa', 'Office', 'Shop', 'Warehouse', 'Land', 'Commercial']
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
  // Assigned user/agent
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Timestamps
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

// Indexes for better query performance
clientSchema.index({ type: 1, status: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ phone: 1 });
clientSchema.index({ assignedTo: 1 });
clientSchema.index({ location: 1 });
clientSchema.index({ leadSource: 1 });
clientSchema.index({ tags: 1 });
clientSchema.index({ createdAt: -1 });

// Ensure unique email
clientSchema.index({ email: 1 }, { unique: true });

// Pre-save middleware to update updatedAt
clientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Client', clientSchema);