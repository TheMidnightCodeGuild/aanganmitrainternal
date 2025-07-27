const bcrypt = require('bcryptjs');
const User = require('../models/user');
const connectDB = require('../config/database');

const testUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '+91-9876543210',
    address: 'Mumbai, Maharashtra',
    role: 'admin',
    isActive: true
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    phone: '+91-9876543211',
    address: 'Delhi, NCR',
    role: 'agent',
    isActive: true
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    password: 'password123',
    phone: '+91-9876543212',
    address: 'Bangalore, Karnataka',
    role: 'manager',
    isActive: true
  },
  {
    name: 'Alice Brown',
    email: 'alice@example.com',
    password: 'password123',
    phone: '+91-9876543213',
    address: 'Chennai, Tamil Nadu',
    role: 'agent',
    isActive: true
  }
];

const createTestUsers = async () => {
  try {
    await connectDB();
    
    console.log('Creating test users...');
    
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      await user.save();
      console.log(`✅ Created user: ${userData.email}`);
    }
    
    console.log('🎉 Test users created successfully!');
    console.log('\n📋 Test User Credentials:');
    console.log('========================');
    testUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
};

// Run the seeder
createTestUsers(); 