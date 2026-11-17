const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hris_db';
  const maskedUri = uri.replace(/:([^:@]{3})[^:@]*@/, ':****@');

  try {
    // Attempt connecting to the configured MongoDB URI with a short timeout
    console.log(`[MongoDB] Connecting to enterprise database at: ${maskedUri}...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('✅ [MongoDB] Connected successfully to enterprise MongoDB database cluster.');
  } catch (err) {
    console.warn(`⚠️ [MongoDB] Could not reach external cluster (${err.message}).`);
    console.log('🔄 [MongoDB] Launching High-Performance In-Memory MongoDB Server for instant local operation...');

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
