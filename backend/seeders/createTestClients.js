const Client = require('../models/client');
const User = require('../models/user');
const connectDB = require('../config/database');

const testClients = [
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+91-9876543210',
    address: 'Mumbai, Maharashtra',
    type: 'individual',
    leadSource: 'website',
    preferences: {
      propertyTypes: ['Apartment'],
      cities: ['Mumbai'],
      budget: {
        min: 5000000,
        max: 10000000
      },
      area: {
        min: 800,
        max: 1500
      }
    },
    notes: 'Interested in 2-3 BHK apartments in Mumbai. Budget range 50L-1Cr. Prefers ready-to-move properties.',
    status: 'active'
  },
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@email.com',
    phone: '+91-9876543211',
    address: 'Delhi, NCR',
    type: 'individual',
    leadSource: 'referral',
    preferences: {
      propertyTypes: ['Villa'],
      cities: ['Gurgaon'],
      budget: {
        min: 10000000,
        max: 20000000
      },
      area: {
        min: 2000,
        max: 4000
      }
    },
    notes: 'Looking for luxury villas in Gurgaon. High-end buyer with budget 1-2Cr. Prefers gated communities.',
    status: 'active'
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    phone: '+91-9876543212',
    address: 'Bangalore, Karnataka',
    type: 'individual',
    leadSource: 'instagram',
    preferences: {
      propertyTypes: ['Apartment'],
      cities: ['Bangalore'],
      budget: {
        min: 3000000,
        max: 7000000
      },
      area: {
        min: 500,
        max: 1000
      }
    },
    notes: 'First-time homebuyer. Looking for 1-2 BHK apartments in Bangalore. Budget conscious buyer.',
    status: 'active'
  },
  {
    name: 'Amit Patel',
    email: 'amit.patel@email.com',
    phone: '+91-9876543213',
    address: 'Pune, Maharashtra',
    type: 'broker',
    leadSource: 'walk-in',
    preferences: {
      propertyTypes: ['Apartment', 'House', 'Villa', 'Office'],
      cities: ['Pune'],
      budget: {
        min: 0,
        max: 50000000
      },
      area: {
        min: 0,
        max: 10000
      }
    },
    notes: 'Real estate broker looking for properties to list. Handles multiple clients.',
    status: 'active'
  },
  {
    name: 'Sunita Reddy',
    email: 'sunita.reddy@email.com',
    phone: '+91-9876543214',
    address: 'Hyderabad, Telangana',
    type: 'individual',
    leadSource: 'facebook',
    preferences: {
      propertyTypes: ['Apartment'],
      cities: ['Hyderabad'],
      budget: {
        min: 8000000,
        max: 15000000
      },
      area: {
        min: 1000,
        max: 2000
      }
    },
    notes: 'Family of 4 looking for spacious 2-3 BHK in Hyderabad. Prefers family-friendly neighborhoods.',
    status: 'active'
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@email.com',
    phone: '+91-9876543215',
    address: 'Chennai, Tamil Nadu',
    type: 'agency',
    leadSource: 'google',
    preferences: {
      propertyTypes: ['Apartment', 'House', 'Villa', 'Office', 'Shop'],
      cities: ['Chennai'],
      budget: {
        min: 0,
        max: 100000000
      },
      area: {
        min: 0,
        max: 20000
      }
    },
    notes: 'Property agency representing multiple clients. Looking for various property types.',
    status: 'active'
  },
  {
    name: 'Meera Iyer',
    email: 'meera.iyer@email.com',
    phone: '+91-9876543216',
    address: 'Kolkata, West Bengal',
    type: 'individual',
    leadSource: 'referral',
    preferences: {
      propertyTypes: ['Apartment'],
      cities: ['Kolkata'],
      budget: {
        min: 4000000,
        max: 8000000
      },
      area: {
        min: 800,
        max: 1500
      }
    },
    notes: 'Working professional looking for investment property. Prefers properties with good rental potential.',
    status: 'inactive'
  },
  {
    name: 'Arjun Malhotra',
    email: 'arjun.malhotra@email.com',
    phone: '+91-9876543217',
    address: 'Ahmedabad, Gujarat',
    type: 'individual',
    leadSource: 'website',
    preferences: {
      propertyTypes: ['Apartment'],
      cities: ['Ahmedabad'],
      budget: {
        min: 6000000,
        max: 12000000
      },
      area: {
        min: 1000,
        max: 1800
      }
    },
    notes: 'Young couple looking for their first home. Prefers modern amenities and good connectivity.',
    status: 'active'
  }
];

const createTestClients = async () => {
  try {
    await connectDB();
    
    console.log('Creating test clients...');
    
    // Get a user to assign clients to
    const user = await User.findOne({ role: 'agent' });
    if (!user) {
      console.log('No agent user found. Please create test users first.');
      process.exit(1);
    }
    
    for (const clientData of testClients) {
      // Check if client already exists
      const existingClient = await Client.findOne({ email: clientData.email });
      
      if (existingClient) {
        console.log(`Client ${clientData.email} already exists, skipping...`);
        continue;
      }
      
      // Create client
      const client = new Client({
        ...clientData,
        assignedTo: user._id
      });
      
      await client.save();
      console.log(`✅ Created client: ${clientData.name} (${clientData.email})`);
    }
    
    console.log('🎉 Test clients created successfully!');
    console.log('\n📋 Test Client Summary:');
    console.log('=======================');
    console.log(`Total clients created: ${testClients.length}`);
    console.log(`Assigned to: ${user.name} (${user.email})`);
    console.log('\nClient Types:');
    const typeCount = testClients.reduce((acc, client) => {
      acc[client.type] = (acc[client.type] || 0) + 1;
      return acc;
    }, {});
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test clients:', error);
    process.exit(1);
  }
};

// Run the seeder
createTestClients(); 