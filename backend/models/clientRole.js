'use strict';
const mongoose = require('mongoose');

const clientRoleSchema = new mongoose.Schema({
  // Reference to the client
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  // Role type: buyer, seller, referrer
  role: {
    type: String,
    enum: ['buyer', 'seller', 'referrer'],
    required: true
  },
  // Optional property reference (for buyer/seller roles)
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  // Status of this role
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'cancelled'],
    default: 'active'
  },
  // Commission details (for referrer role)
  commission: {
    type: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'fixed'
    },
    value: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  // Relationship notes (for referrer role)
  relationshipNote: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Additional notes for this role
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // Assigned user/agent for this role
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
clientRoleSchema.index({ clientId: 1, role: 1 });
clientRoleSchema.index({ propertyId: 1 });
clientRoleSchema.index({ role: 1, status: 1 });
clientRoleSchema.index({ assignedTo: 1 });
clientRoleSchema.index({ createdAt: -1 });

// Ensure unique client-role-property combination
clientRoleSchema.index({ 
  clientId: 1, 
  role: 1, 
  propertyId: 1 
}, { 
  unique: true,
  sparse: true // Allow null propertyId values
});

// Pre-save middleware to update updatedAt
clientRoleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Post-save middleware to update client's activeRoles and status
clientRoleSchema.post('save', async function() {
  try {
    const Client = mongoose.model('Client');
    const ClientRole = mongoose.model('ClientRole');
    
    // Get all active roles for this client
    const activeRoles = await ClientRole.find({
      clientId: this.clientId,
      status: 'active'
    }).distinct('role');
    
    // Update client's activeRoles
    await Client.findByIdAndUpdate(this.clientId, {
      activeRoles: activeRoles,
      // Automatically set status to active if there are active roles, inactive otherwise
      status: activeRoles.length > 0 ? 'active' : 'inactive'
    });
  } catch (error) {
    console.error('Error updating client activeRoles and status:', error);
  }
});

// Post-remove middleware to update client's activeRoles and status
clientRoleSchema.post('remove', async function() {
  try {
    const Client = mongoose.model('Client');
    const ClientRole = mongoose.model('ClientRole');
    
    // Get all active roles for this client
    const activeRoles = await ClientRole.find({
      clientId: this.clientId,
      status: 'active'
    }).distinct('role');
    
    // Update client's activeRoles
    await Client.findByIdAndUpdate(this.clientId, {
      activeRoles: activeRoles,
      // Automatically set status to active if there are active roles, inactive otherwise
      status: activeRoles.length > 0 ? 'active' : 'inactive'
    });
  } catch (error) {
    console.error('Error updating client activeRoles and status:', error);
  }
});

// Virtual for commission display
clientRoleSchema.virtual('commissionDisplay').get(function() {
  if (!this.commission || this.commission.value === 0) return null;
  
  if (this.commission.type === 'percentage') {
    return `${this.commission.value}%`;
  } else {
    return `₹${this.commission.value.toLocaleString()}`;
  }
});

// Ensure virtuals are included in JSON output
clientRoleSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('ClientRole', clientRoleSchema); 