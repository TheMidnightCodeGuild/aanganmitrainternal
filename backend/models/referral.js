'use strict';
const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  // The referrer (who made the referral)
  referredByClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  // What was referred: either a client or a property
  referredType: {
    type: String,
    enum: ['client', 'property'],
    required: true
  },
  // The referred client (if referring a client)
  referredClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  // The referred property (if referring a property)
  referredPropertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  // Deal ID when the referral converts
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  },
  // Commission details
  commission: {
    type: {
      type: String,
      enum: ['fixed', 'percentage'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    promised: {
      type: Number,
      required: true
    },
    paid: {
      type: Number,
      default: 0
    }
  },
  // Commission status
  commissionStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'cancelled'],
    default: 'pending'
  },
  // Referral status
  status: {
    type: String,
    enum: ['active', 'converted', 'expired', 'cancelled'],
    default: 'active'
  },
  // Referral chain support (if multiple brokers involved)
  parentReferralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral'
  },
  // Chain level (1 = direct referral, 2 = secondary, etc.)
  chainLevel: {
    type: Number,
    default: 1
  },
  // Notes about the referral
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
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
  },
  // When the referral was converted
  convertedAt: {
    type: Date
  },
  // When commission was paid
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
referralSchema.index({ referredByClientId: 1 });
referralSchema.index({ referredClientId: 1 });
referralSchema.index({ referredPropertyId: 1 });
referralSchema.index({ dealId: 1 });
referralSchema.index({ status: 1 });
referralSchema.index({ commissionStatus: 1 });
referralSchema.index({ assignedTo: 1 });
referralSchema.index({ createdAt: -1 });
referralSchema.index({ parentReferralId: 1 });

// Ensure either referredClientId or referredPropertyId is provided
referralSchema.pre('save', function(next) {
  if (!this.referredClientId && !this.referredPropertyId) {
    return next(new Error('Either referredClientId or referredPropertyId must be provided'));
  }
  if (this.referredClientId && this.referredPropertyId) {
    return next(new Error('Cannot refer both client and property simultaneously'));
  }
  next();
});

// Pre-save middleware to update updatedAt
referralSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for commission display
referralSchema.virtual('commissionDisplay').get(function() {
  if (!this.commission) return null;
  
  if (this.commission.type === 'percentage') {
    return `${this.commission.value}%`;
  } else {
    return `₹${this.commission.value.toLocaleString()}`;
  }
});

// Virtual for remaining commission
referralSchema.virtual('remainingCommission').get(function() {
  if (!this.commission) return 0;
  return this.commission.promised - this.commission.paid;
});

// Virtual for commission percentage paid
referralSchema.virtual('commissionPercentagePaid').get(function() {
  if (!this.commission || this.commission.promised === 0) return 0;
  return (this.commission.paid / this.commission.promised) * 100;
});

// Ensure virtuals are included in JSON output
referralSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Referral', referralSchema); 