const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const mongoose = require('mongoose');

async function testConnection() {
  console.log('\n--- ExamFlow MongoDB Atlas Connection Test ---');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is missing from server/.env');
    process.exit(1);
  }

  // Safe masked display (never leak credentials)
  const maskedUri = uri.replace(/\/\/(.*):(.*)@/, '//***:***@');
  console.log(`📡 Target URI: ${maskedUri}`);

  const isConnected = await connectDB();
  
  if (isConnected) {
    console.log('🎉 Verification PASSED: MongoDB Atlas cluster is reachable and connected!');
    await mongoose.connection.close();
    process.exit(0);
  } else {
    console.log('⚠️ Verification PENDING: Follow the instructions above to configure your Atlas credentials.');
    process.exit(0);
  }
}

testConnection();
