const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hris_db';

  try {
    // Attempt connecting to the configured MongoDB URI with a short timeout
    console.log(`[MongoDB] Connecting to MongoDB at: ${uri}...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('✅ [MongoDB] Connected successfully to configured MongoDB database.');
  } catch (err) {
    console.warn(`⚠️ [MongoDB] Could not connect to external MongoDB server (${err.message}).`);
    console.log('🔄 [MongoDB] Initializing Embedded In-Memory MongoDB Server for instant local operation...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      console.log(`[MongoDB] In-Memory MongoDB running at: ${memoryUri}`);

      await mongoose.connect(memoryUri);
      console.log('✅ [MongoDB] Connected successfully to In-Memory MongoDB instance.');
      console.log('💡 [Tip] To connect to a persistent MongoDB instance or MongoDB Atlas, update MONGODB_URI in server/.env');
    } catch (memErr) {
      console.error('❌ [MongoDB] Fatal Error: Could not start in-memory MongoDB either:', memErr.message);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
};

module.exports = { connectDB, disconnectDB };
