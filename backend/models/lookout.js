'use strict';
const mongoose = require('mongoose');

const lookoutSchema = new mongoose.Schema({
  // Reference to the client
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  // Lookout title/name
  title: {
    type: String,
    required: true,
    trim: true
  },
  // Property types they're looking for
  propertyTypes: [{
    type: String,
    enum: ['Apartment', 'House', 'Villa', 'Office', 'Shop', 'Warehouse', 'Land', 'Commercial']
  }],
  // Preferred cities
  cities: [String],
  // Budget range
  budget: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  // Area range
  area: {
    min: Number,
    max: Number,
    unit: {
      type: String,
      default: 'sq ft'
    }
  },
  // Specific requirements/notes
  requirements: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Status of this lookout
  status: {
    type: String,
    enum: ['active', 'on-hold', 'completed', 'cancelled'],
    default: 'active'
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
lookoutSchema.index({ clientId: 1, status: 1 });
lookoutSchema.index({ status: 1, priority: 1 });
lookoutSchema.index({ assignedTo: 1 });
lookoutSchema.index({ cities: 1 });
lookoutSchema.index({ propertyTypes: 1 });
lookoutSchema.index({ createdAt: -1 });

// Pre-save middleware to update updatedAt
lookoutSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for budget display
lookoutSchema.virtual('budgetDisplay').get(function() {
  if (!this.budget || (!this.budget.min && !this.budget.max)) return 'Not specified';
  
  const currency = this.budget.currency || 'INR';
  const symbol = currency === 'INR' ? '₹' : currency;
  
  if (this.budget.min && this.budget.max) {
    return `${symbol}${this.budget.min.toLocaleString()} - ${symbol}${this.budget.max.toLocaleString()}`;
  } else if (this.budget.min) {
    return `${symbol}${this.budget.min.toLocaleString()}+`;
  } else if (this.budget.max) {
    return `Up to ${symbol}${this.budget.max.toLocaleString()}`;
  }
  
  return 'Not specified';
});

// Virtual for area display
lookoutSchema.virtual('areaDisplay').get(function() {
  if (!this.area || (!this.area.min && !this.area.max)) return 'Not specified';
  
  const unit = this.area.unit || 'sq ft';
  
  if (this.area.min && this.area.max) {
    return `${this.area.min.toLocaleString()} - ${this.area.max.toLocaleString()} ${unit}`;
  } else if (this.area.min) {
    return `${this.area.min.toLocaleString()}+ ${unit}`;
  } else if (this.area.max) {
    return `Up to ${this.area.max.toLocaleString()} ${unit}`;
  }
  
  return 'Not specified';
});

// Ensure virtuals are included in JSON output
lookoutSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Lookout', lookoutSchema); 