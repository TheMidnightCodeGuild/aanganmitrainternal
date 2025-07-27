const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  zoning: {
    type: String,
    required: true,
    enum: ['Residential', 'Commercial', 'Industrial', 'Mixed Use', 'Agricultural']
  },
  zoningNote: {
    type: String,
    trim: true
  },
  furnishing: {
    type: String,
    enum: ['Furnished', 'Semi-Furnished', 'Unfurnished']
  },
  age: {
    year: {
      type: Number,
      min: 1900,
      max: 2024
    },
    month: {
      type: String,
      enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    }
  },
  type: {
    type: String,
    required: true,
    enum: ['Apartment', 'House', 'Villa', 'Office', 'Shop', 'Warehouse', 'Land']
  },
  area: {
    type: Number,
    required: true,
    min: 0
  },
  perSqFtRate: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Under Contract', 'Sold', 'Rented', 'Off Market']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  additionalNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Owner information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerType: {
    type: String,
    enum: ['existing', 'new'],
    required: true
  },
  
  // Reference information
  ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  refType: {
    type: String,
    enum: ['existing', 'new']
  },
  
  // Files (Google Drive references)
  files: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    originalSize: {
      type: Number,
      required: true
    },
    driveId: {
      type: String,
      required: true
    },
    driveUrl: {
      type: String,
      required: true
    },
    compressionRatio: {
      type: Number,
      min: 0,
      max: 100
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
propertySchema.index({ city: 1, status: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ createdBy: 1 });
propertySchema.index({ createdAt: -1 });

// Virtual for age display
propertySchema.virtual('ageDisplay').get(function() {
  if (!this.age.year) return '';
  if (!this.age.month) return `${this.age.year} years old`;
  return `${this.age.month} ${new Date().getFullYear() - this.age.year} years old`;
});

// Ensure virtual fields are serialized
propertySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Property', propertySchema);