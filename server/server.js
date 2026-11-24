const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const app = require('./src/app');

// Connect to MongoDB Atlas
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[ExamFlow] Server running on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`[ExamFlow Error] ${err.message}`);
});
