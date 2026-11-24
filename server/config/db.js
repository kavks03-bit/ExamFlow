const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * Reads MONGODB_URI from environment variables.
 * Enforces connecting to the 'examflow' database.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    console.warn('\n======================================================');
    console.warn('⚠️  MONGODB_URI is not yet configured with real credentials!');
    console.warn('   Please open server/.env and replace <username> and <password>');
    console.warn('   with your actual MongoDB Atlas database user details.');
    console.warn('======================================================\n');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'examflow',
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of hanging
    });

    console.log('\n======================================================');
    console.log('✅  MongoDB Atlas Connected Successfully!');
    console.log(`📦  Database Name : ${conn.connection.name}`);
    console.log(`🌐  Cluster Host  : ${conn.connection.host}`);
    console.log(`⚡  Connection State: Ready (State ${conn.connection.readyState})`);
    console.log('======================================================\n');
    return true;
  } catch (error) {
    console.error('\n======================================================');
    console.error('❌  MongoDB Atlas Connection Failed!');
    console.error(`   Error Message: ${error.message}`);

    // Provide friendly diagnostics for common MongoDB Atlas issues
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('\n🔍  DIAGNOSIS: Authentication Failed');
      console.error('   • The database username or password in server/.env is incorrect.');
      console.error('   • Note: If your password contains special characters (e.g. @, #, $, %),');
      console.error('     they must be URL-encoded (e.g. @ becomes %40).');
      console.error('   • Check MongoDB Atlas > Database Access to verify your user.');
    } else if (error.message.includes('whitelist') || error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT') || error.code === 'ETIMEOUT') {
      console.error('\n🔍  DIAGNOSIS: Network Access / IP Whitelist Error');
      console.error('   • Your current IP address is not authorized in MongoDB Atlas.');
      console.error('   • Fix: In MongoDB Atlas, go to "Network Access" > "Add IP Address"');
      console.error('     and select "Allow Access From Anywhere" (0.0.0.0/0).');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.error('\n🔍  DIAGNOSIS: DNS / Cluster Hostname Error');
      console.error('   • Could not resolve your MongoDB Atlas cluster hostname.');
      console.error('   • Make sure your connection string matches the one from');
      console.error('     MongoDB Atlas > Clusters > Connect > Drivers.');
    }
    console.error('======================================================\n');

    // Do not crash during development so server can still serve health check
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return false;
  }
};

module.exports = connectDB;
