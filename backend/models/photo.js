'use strict';
const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
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
}, {
  timestamps: true
});

module.exports = mongoose.model('Photo', photoSchema);