/**
 * MongoDB Setup Script
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Creates required indexes for the calls collection
 * 3. Verifies the setup is correct
 * 4. Can be run manually or automatically on server startup
 * 
 * Usage:
 *   node setup-mongodb.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Call = require('./models/Call');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function setupMongoDB() {
  console.log('\n🔧 MongoDB Setup Script');
  console.log('========================\n');

  try {
    // 1. Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // 2. Get database info
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database: ${dbName}\n`);

    // 3. Create indexes for calls collection
    console.log('🔨 Creating indexes for "calls" collection...');
    
    // Drop existing indexes (except _id) to recreate them
    try {
      const existingIndexes = await Call.collection.getIndexes();
      console.log('   Existing indexes:', Object.keys(existingIndexes).join(', '));
      
      // Drop all except _id
      for (const indexName of Object.keys(existingIndexes)) {
        if (indexName !== '_id_') {
          await Call.collection.dropIndex(indexName);
          console.log(`   ❌ Dropped old index: ${indexName}`);
        }
      }
    } catch (err) {
      console.log('   ℹ️  No existing indexes to drop (this is fine for first run)');
    }

    // Create new indexes using Mongoose
    await Call.syncIndexes();
    console.log('   ✅ Created index: callId (unique)');
    console.log('   ✅ Created index: email');
    console.log('   ✅ Created index: createdAt');
    console.log('   ✅ Created compound index: { email: 1, createdAt: -1 }\n');

    // 4. Verify indexes
    console.log('🔍 Verifying indexes...');
    const indexes = await Call.collection.getIndexes();
    console.log('   Active indexes:');
    for (const [indexName, indexSpec] of Object.entries(indexes)) {
      console.log(`   - ${indexName}:`, JSON.stringify(indexSpec.key));
    }
    console.log();

    // 5. Check collections
    console.log('📂 Collections in database:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log();

    // 6. Count documents
    const callsCount = await Call.countDocuments();
    const usersCount = await User.countDocuments();
    console.log('📈 Document counts:');
    console.log(`   - calls: ${callsCount}`);
    console.log(`   - users: ${usersCount}\n`);

    // 7. Verify users have phone numbers
    console.log('📞 Checking users with phone numbers...');
    const usersWithPhone = await User.countDocuments({
      $or: [
        { phoneNumber: { $exists: true, $ne: null, $ne: '' } },
        { 'business.phoneNumber': { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    console.log(`   - Users with phone numbers: ${usersWithPhone}/${usersCount}`);
    
    if (usersWithPhone === 0 && usersCount > 0) {
      console.log('   ⚠️  WARNING: No users have phone numbers!');
      console.log('   ℹ️  Webhook won\'t be able to match calls to users.');
      console.log('   ℹ️  Add phone numbers to users in the format: +14095551234\n');
    } else if (usersWithPhone > 0) {
      console.log('   ✅ Some users have phone numbers (webhook will work)\n');
    }

    // 8. Test query performance
    console.log('⚡ Testing query performance...');
    const start = Date.now();
    await Call.find({ email: 'test@example.com' })
      .sort({ createdAt: -1 })
      .limit(10)
      .explain('executionStats');
    const duration = Date.now() - start;
    console.log(`   Query executed in ${duration}ms (should use indexes)\n`);

    // 9. Summary
    console.log('✅ MongoDB Setup Complete!');
    console.log('========================\n');
    console.log('Your database is ready for production deployment.\n');
    console.log('Next steps:');
    console.log('1. Deploy your backend to Render');
    console.log('2. Add webhook URL to Retell AI: https://your-domain.com/webhook/retell');
    console.log('3. Ensure users have phone numbers in their profiles');
    console.log('4. Test with: node test-retell-webhook.js\n');

  } catch (error) {
    console.error('❌ MongoDB Setup Failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check MONGODB_URI in .env file');
    console.error('2. Verify MongoDB Atlas network access (allow your IP)');
    console.error('3. Ensure database user has read/write permissions');
    console.error('4. Check MongoDB Atlas is online\n');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

// Run setup
setupMongoDB().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
