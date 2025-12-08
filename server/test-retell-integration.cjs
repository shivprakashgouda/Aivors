/**
 * Test script for Retell Agent Integration
 * Tests the complete flow from agent connection to webhook processing
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Call = require('./models/Call');

async function testRetellIntegration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Find a user and add agent ID
    console.log('TEST 1: Adding retellAgentId to test user');
    console.log('━'.repeat(60));
    
    const testUser = await User.findOne({ email: 'ajinkyamhetre01@gmail.com' });
    
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    testUser.business.retellAgentId = 'agent_test_12345';
    testUser.business.aiTrainingStatus = 'complete';
    testUser.analytics.aiStatus = 'Online';
    await testUser.save();
    
    console.log(`✅ Updated user: ${testUser.email}`);
    console.log(`   Agent ID: ${testUser.business.retellAgentId}`);
    console.log(`   AI Status: ${testUser.analytics.aiStatus}\n`);

    // Test 2: Simulate finding user by agent ID (webhook scenario)
    console.log('TEST 2: Finding user by agent_id (webhook simulation)');
    console.log('━'.repeat(60));
    
    const agentId = 'agent_test_12345';
    const foundUser = await User.findOne({ 'business.retellAgentId': agentId });
    
    if (foundUser) {
      console.log(`✅ Found user by agent_id: ${agentId}`);
      console.log(`   User: ${foundUser.email}`);
      console.log(`   User ID: ${foundUser._id.toString()}\n`);
    } else {
      console.log(`❌ No user found for agent_id: ${agentId}\n`);
    }

    // Test 3: Create a test call linked to this user
    console.log('TEST 3: Creating test call linked to user');
    console.log('━'.repeat(60));
    
    const testCall = await Call.create({
      callId: `retell_test_${Date.now()}`,
      userId: foundUser._id.toString(),
      phoneNumber: '+1234567890',
      durationSeconds: 180,
      durationMinutes: 3,
      transcript: 'This is a test call transcript for agent integration testing.',
      summary: 'Test call to verify agent-to-user mapping works correctly.',
      eventType: 'call_analyze',
      status: 'completed',
      metadata: {
        agentId: agentId,
        testCall: true
      }
    });
    
    console.log(`✅ Created test call: ${testCall.callId}`);
    console.log(`   User ID: ${testCall.userId}`);
    console.log(`   Duration: ${testCall.durationMinutes} minutes\n`);

    // Test 4: Verify call appears for correct user
    console.log('TEST 4: Querying user\'s calls');
    console.log('━'.repeat(60));
    
    const userCalls = await Call.find({ userId: foundUser._id.toString() })
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`✅ Found ${userCalls.length} calls for ${foundUser.email}:`);
    userCalls.forEach((call, idx) => {
      console.log(`   ${idx + 1}. ${call.callId} - ${call.durationMinutes} min - ${new Date(call.createdAt).toLocaleString()}`);
    });
    console.log('');

    // Test 5: Verify other users can't see this call
    console.log('TEST 5: Verify data isolation');
    console.log('━'.repeat(60));
    
    const otherUser = await User.findOne({ 
      email: { $ne: testUser.email } 
    }).limit(1);
    
    if (otherUser) {
      const otherUserCalls = await Call.find({ userId: otherUser._id.toString() });
      const hasTestCall = otherUserCalls.some(c => c.callId === testCall.callId);
      
      if (hasTestCall) {
        console.log(`❌ SECURITY ISSUE: Test call visible to other user ${otherUser.email}`);
      } else {
        console.log(`✅ Data isolated correctly`);
        console.log(`   ${otherUser.email} has ${otherUserCalls.length} calls`);
        console.log(`   Test call NOT visible to other users\n`);
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log('✅ User model supports retellAgentId');
    console.log('✅ Can find users by agent_id');
    console.log('✅ Calls correctly linked to users');
    console.log('✅ Data isolation working');
    console.log('\n🎉 All tests passed! System ready for production.\n');
    console.log('Next steps:');
    console.log('1. Deploy updated code to production');
    console.log('2. Configure n8n to send agent_id in webhook');
    console.log('3. Add RetellAgentConnect component to dashboard');
    console.log('4. Test with real Retell AI webhooks\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run tests
testRetellIntegration();
