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
  // Client status: active, inactive - automatically managed based on property listings
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // Active roles - computed field that will be populated from ClientRole
  activeRoles: [{
    type: String,
    enum: ['buyer', 'seller', 'referrer']
  }],
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
clientSchema.index({ activeRoles: 1 });
clientSchema.index({ createdAt: -1 });

// Ensure unique email
clientSchema.index({ email: 1 }, { unique: true });

// Pre-save middleware to update updatedAt
clientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for status display
clientSchema.virtual('statusDisplay').get(function() {
  if (this.status === 'inactive') {
    return 'Inactive';
  }
  
  if (!this.activeRoles || this.activeRoles.length === 0) {
    return 'Active (No Roles)';
  }
  
  const roleLabels = this.activeRoles.map(role => {
    switch (role) {
      case 'buyer': return 'Buyer';
      case 'seller': return 'Seller';
      case 'referrer': return 'Reference';
      default: return role;
    }
  });
  
  return `Active (${roleLabels.join(', ')})`;
});

// Ensure virtuals are included in JSON output
clientSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Client', clientSchema);