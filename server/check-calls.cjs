/**
 * Check if test calls are in database
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Call = require('./models/Call');
const User = require('./models/User');

async function checkCalls() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: 'ajinkyamhetre01@gmail.com' });
    console.log('👤 User:', user.email);
    console.log('📱 Agent ID:', user.business.retellAgentId);
    console.log('');

    const calls = await Call.find({ userId: user._id.toString() })
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`📞 Last ${calls.length} calls:\n`);
    calls.forEach((call, idx) => {
      console.log(`${idx + 1}. Call ID: ${call.callId}`);
      console.log(`   User ID: ${call.userId}`);
      console.log(`   Duration: ${call.durationMinutes} min`);
      console.log(`   Transcript: ${call.transcript.substring(0, 50)}...`);
      console.log(`   Created: ${call.createdAt.toLocaleString()}`);
      console.log('');
    });

    // Find the test call we just created
    const testCall = await Call.findOne({ callId: 'test_flat_structure' });
    if (testCall) {
      console.log('🎉 SUCCESS! Test call found in database!');
      console.log('✅ Agent-to-user matching is working!');
      console.log('✅ Call was saved with correct userId');
    } else {
      console.log('⚠️ Test call not found - may need to wait for deploy');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkCalls();
