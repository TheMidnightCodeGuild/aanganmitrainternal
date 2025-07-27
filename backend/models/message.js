'use strict';
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread',
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  attachments: [{
    name: String,
    type: String,
    size: Number,
    driveId: String,
    driveUrl: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);