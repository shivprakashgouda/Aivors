/**
 * Assign Retell AI Agent to User Account
 * This script updates the User document to link the Retell agent to your account
 */

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const assignAgentToUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in environment variables!');
      console.log('   Please check your .env file has either MONGODB_URI or MONGO_URI');
      process.exit(1);
    }
    
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // User details
    const userEmail = 'ajinkyamhetre01@gmail.com';
    const retellAgentId = 'agent_2faeaea2dcfa43016ec8aa47a3';
    const llmId = 'llm_6ebc1d7bd6550089f4dc9f0e1e48';

    console.log('🔍 Finding user:', userEmail);
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.error('❌ User not found:', userEmail);
      console.log('\n💡 Please check if the email is correct or create the user first.');
      process.exit(1);
    }

    console.log('✅ User found!');
    console.log('   User ID:', user._id.toString());
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('');

    // Update user with Retell agent info
    console.log('🔗 Assigning Retell AI agent to your account...');
    
    user.business = user.business || {};
    user.business.retellAgentId = retellAgentId;
    user.business.retellLLMId = llmId;
    user.business.phoneNumber = user.business.phoneNumber || 'To be configured';
    
    await user.save();

    console.log('✅ Agent successfully assigned!');
    console.log('');
    console.log('📋 Updated Configuration:');
    console.log('   User ID:', user._id.toString());
    console.log('   Email:', user.email);
    console.log('   Retell Agent ID:', user.business.retellAgentId);
    console.log('   Retell LLM ID:', user.business.retellLLMId);
    console.log('');
    console.log('🎉 SUCCESS! Your Retell AI agent is now connected to your account!');
    console.log('');
    console.log('📌 Important: Copy your User ID for Airtable setup:');
    console.log('   ┌────────────────────────────────────────┐');
    console.log('   │ YOUR USER ID (use as owner_id):       │');
    console.log(`   │ ${user._id.toString().padEnd(38)} │`);
    console.log('   └────────────────────────────────────────┘');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. When adding records to Airtable, use this User ID as owner_id');
    console.log('   2. Configure n8n to use this agent_id for webhook routing');
    console.log('   3. Test a call - it should now appear in your dashboard!');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
};

assignAgentToUser();
