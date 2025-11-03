/**
 * Test Script for AI Phone Manager
 * 
 * This script helps developers quickly test and update user data
 * Run with: node server/test-update-user.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// User Model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  role: String,
  status: String,
  subscription: {
    plan: String,
    status: String,
    minutesPurchased: Number,
    minutesRemaining: Number,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    startDate: Date,
    nextBillingDate: Date,
  },
  business: {
    setupStatus: String,
    aiTrainingStatus: String,
    posIntegration: String,
    phoneNumber: String,
  },
  analytics: {
    callsToday: Number,
    callsChangePercent: Number,
    aiStatus: String,
    responseTime: Number,
  },
  recentActivity: [{
    text: String,
    timeAgo: String,
    createdAt: Date,
  }],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Test Data Updates
const testUpdates = {
  // Update 1: Complete Business Setup
  async completeBusinessSetup(email) {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    user.business = {
      setupStatus: 'complete',
      aiTrainingStatus: 'complete',
      posIntegration: 'complete',
      phoneNumber: 'Active 📞',
    };

    await user.save();
    console.log('✅ Business setup completed for:', email);
  },

  // Update 2: Set Active Analytics
  async updateAnalytics(email) {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    user.analytics = {
      callsToday: 147,
      callsChangePercent: 23,
      aiStatus: 'Online',
      responseTime: 0.8,
    };

    await user.save();
    console.log('✅ Analytics updated for:', email);
  },

  // Update 3: Add Sample Activity
  async addActivity(email) {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    const activities = [
      {
        text: 'Order taken: 2× Margherita Pizza, 1× Caesar Salad – $34.50',
        timeAgo: '2 minutes ago',
        createdAt: new Date(),
      },
      {
        text: 'Customer inquiry: Menu prices and delivery time',
        timeAgo: '15 minutes ago',
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        text: 'Reservation confirmed: Table for 4, 7:00 PM tonight',
        timeAgo: '1 hour ago',
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    ];

    user.recentActivity = activities;
    await user.save();
    console.log('✅ Activity added for:', email);
  },

  // Update 4: Activate Subscription
  async activateSubscription(email, plan = 'Pro Monthly') {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    user.subscription = {
      plan: plan,
      status: 'active',
      minutesPurchased: 2000,
      minutesRemaining: 1850,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      startDate: new Date(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    user.status = 'active';
    await user.save();
    console.log('✅ Subscription activated for:', email);
  },

  // Update 5: Complete Setup (All in One)
  async completeFullSetup(email) {
    await this.completeBusinessSetup(email);
    await this.updateAnalytics(email);
    await this.addActivity(email);
    await this.activateSubscription(email);
    console.log('✅ Full setup completed for:', email);
  },

  // View User Data
  async viewUser(email) {
    const user = await User.findOne({ email }).select('-passwordHash -__v');
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📊 User Data:');
    console.log(JSON.stringify(user.toObject(), null, 2));
  },

  // List All Users
  async listUsers() {
    const users = await User.find().select('email name role status');
    console.log('\n📋 All Users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Role: ${user.role}, Status: ${user.status}`);
    });
  },
};

// Main function
const main = async () => {
  await connectDB();

  // Get command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  const email = args[1];

  console.log('\n🚀 AI Phone Manager - Test Script\n');

  try {
    switch (command) {
      case 'business':
        await testUpdates.completeBusinessSetup(email);
        break;

      case 'analytics':
        await testUpdates.updateAnalytics(email);
        break;

      case 'activity':
        await testUpdates.addActivity(email);
        break;

      case 'subscription':
        await testUpdates.activateSubscription(email, args[2] || 'Pro Monthly');
        break;

      case 'full':
        await testUpdates.completeFullSetup(email);
        break;

      case 'view':
        await testUpdates.viewUser(email);
        break;

      case 'list':
        await testUpdates.listUsers();
        break;

      default:
        console.log('Usage:');
        console.log('  node server/test-update-user.js business <email>          - Complete business setup');
        console.log('  node server/test-update-user.js analytics <email>         - Update analytics');
        console.log('  node server/test-update-user.js activity <email>          - Add sample activities');
        console.log('  node server/test-update-user.js subscription <email> [plan] - Activate subscription');
        console.log('  node server/test-update-user.js full <email>              - Complete full setup');
        console.log('  node server/test-update-user.js view <email>              - View user data');
        console.log('  node server/test-update-user.js list                      - List all users');
        console.log('\nExamples:');
        console.log('  node server/test-update-user.js full user@example.com');
        console.log('  node server/test-update-user.js subscription user@example.com "Pro Monthly"');
        console.log('  node server/test-update-user.js list');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await mongoose.connection.close();
  console.log('\n✅ Done!\n');
  process.exit(0);
};

// Run the script
main();
