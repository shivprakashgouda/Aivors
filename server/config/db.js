const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 6+ doesn't need these options
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-create indexes on startup (production-ready)
    console.log('🔨 Ensuring MongoDB indexes...');
    try {
      const Call = require('../models/Call');
      await Call.syncIndexes();
      console.log('✅ Call indexes synchronized');
    } catch (indexError) {
      console.warn('⚠️  Index sync warning:', indexError.message);
      // Don't fail startup if indexes can't be created
      // They can be created manually with setup-mongodb.js
    }
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
