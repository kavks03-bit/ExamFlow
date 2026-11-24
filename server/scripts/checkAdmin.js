// Quick script to verify admin user exists
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

async function run() {
  try {
    await connectDB();
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      console.log('✅ Admin user found:');
      console.log('   email:', admin.email);
      console.log('   hashed password:', admin.password ? '<present>' : 'none');
    } else {
      console.log('❌ No admin user in the collection');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
