
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[MongoDB] MONGODB_URI is not configured.');
    process.exit(1);
  }

  try {
    console.log('[MongoDB] Connecting to MongoDB Atlas...');

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      '[MongoDB] Connected successfully to MongoDB Atlas.'
    );
  } catch (err) {
    console.error(
      '[MongoDB] Connection failed:',
      err.message
    );

    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected successfully.');
  } catch (err) {
    console.error('[MongoDB] Disconnect error:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
