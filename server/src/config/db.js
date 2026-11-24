// Proxy to server/config/db.js to ensure single source of truth
const connectDB = require('../../config/db');
module.exports = connectDB;
