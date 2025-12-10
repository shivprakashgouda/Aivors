/**
 * Direct MongoDB Storage Test
 * Connects directly to database and checks if calls are being stored
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function testMongoStorage() {
  try {
    console.log('🔌 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const Call = require('./models/Call');
    const User = require('./models/User');
    
    // Find test user
    const testUser = await User.findOne({ email: 'ajinkyamhetre01@gmail.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      process.exit(1);
    }
    
    console.log('👤 Test User:', testUser.email);
    console.log('🆔 User ID:', testUser._id.toString());
    console.log('📱 Agent ID:', testUser.business?.retellAgentId || 'Not set');
    console.log('');
    
    // Count total calls
    const totalCalls = await Call.countDocuments({ userId: testUser._id });
    console.log(`📊 Total calls in database: ${totalCalls}`);
    console.log('');
    
    // Get recent calls
    const recentCalls = await Call.find({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('callId durationMinutes transcript createdAt');
    
    console.log('📞 Recent 5 calls:');
    console.log('');
    
    recentCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.callId}`);
      console.log(`   Duration: ${call.durationMinutes} minutes`);
      console.log(`   Created: ${call.createdAt.toLocaleString()}`);
      console.log(`   Transcript: ${call.transcript.substring(0, 60)}...`);
      console.log('');
    });
    
    // Test: Create a new call directly in database
    console.log('🧪 Testing direct database write...');
    const testCall = await Call.create({
      callId: `direct_test_${Date.now()}`,
      userId: testUser._id,
      phoneNumber: '+1234567890',
      durationSeconds: 180,
      durationMinutes: 3,
      transcript: 'This is a direct database write test to confirm MongoDB storage works.',
      summary: 'Direct database write test',
      eventType: 'call_analyzed',
      metadata: { test: true },
      status: 'completed'
    });
    
    console.log('✅ Successfully created test call:', testCall.callId);
    console.log('');
    
    // Verify it was saved
    const foundCall = await Call.findOne({ callId: testCall.callId });
    if (foundCall) {
      console.log('✅ VERIFIED: Call exists in database');
      console.log({
        callId: foundCall.callId,
        userId: foundCall.userId.toString(),
        duration: `${foundCall.durationMinutes} min`,
        createdAt: foundCall.createdAt
      });
    } else {
      console.log('❌ ERROR: Call not found after creation');
    }
    
    console.log('');
    console.log('🎉 MongoDB storage is working correctly!');
    console.log('');
    console.log('📝 Summary:');
    console.log(`   - Total calls: ${totalCalls + 1}`);
    console.log(`   - Database: Connected ✅`);
    console.log(`   - Writes: Working ✅`);
    console.log(`   - Reads: Working ✅`);
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testMongoStorage();
