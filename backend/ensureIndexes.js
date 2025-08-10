const mongoose = require('mongoose');
const Client = require('./models/client');

async function ensureIndexes() {
  try {
    console.log('Ensuring database indexes...');
    
    // Ensure unique indexes on Client model
    await Client.collection.createIndex({ email: 1 }, { unique: true });
    await Client.collection.createIndex({ phone: 1 }, { unique: true });
    
    console.log('✅ All indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  }
}

module.exports = ensureIndexes; 