/**
 * Connect real Retell agent to test user
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function connectRealAgent() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const REAL_AGENT_ID = 'agent_2faeaea2dcfa43016ec8aa47a3';
    
    // Update test user with real agent ID
    const user = await User.findOne({ email: 'ajinkyamhetre01@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    user.business.retellAgentId = REAL_AGENT_ID;
    user.business.aiTrainingStatus = 'complete';
    user.analytics.aiStatus = 'Online';
    await user.save();

    console.log('🎉 SUCCESS! Real Retell agent connected\n');
    console.log('━'.repeat(60));
    console.log('User:', user.email);
    console.log('Agent ID:', user.business.retellAgentId);
    console.log('AI Status:', user.analytics.aiStatus);
    console.log('━'.repeat(60));
    console.log('\n📋 Next Steps:\n');
    console.log('1. ✅ Agent connected to database');
    console.log('2. 🔄 Update n8n HTTP Request URL to:');
    console.log('   https://aivors-5hvj.onrender.com/api/n8n/retell-webhook');
    console.log('3. 📞 Make a test call on Retell');
    console.log('4. 👀 Check dashboard for the call\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

connectRealAgent();
