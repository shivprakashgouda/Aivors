/**
 * Environment Variable Validator
 * Validates critical environment variables on startup to prevent runtime auth issues
 */

const validateEnvironment = () => {
  console.log('\n🔍 ========== ENVIRONMENT VALIDATION ==========');
  
  const issues = [];
  const warnings = [];
  
  // Critical variables
  const critical = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    CLIENT_URL: process.env.CLIENT_URL,
  };
  
  // Important but not critical
  const important = {
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    CORS_ORIGINS: process.env.CORS_ORIGINS,
    PORT: process.env.PORT,
  };
  
  // Check critical variables
  console.log('\n📋 Critical Variables:');
  Object.entries(critical).forEach(([key, value]) => {
    if (!value) {
      issues.push(`${key} is not set`);
      console.log(`   ❌ ${key}: NOT SET (CRITICAL)`);
    } else if (value.includes('replace_me') || value.includes('change_me') || value.includes('your_') || value.includes('fallback')) {
      warnings.push(`${key} appears to be using a placeholder value`);
      console.log(`   ⚠️  ${key}: Using placeholder/fallback value`);
    } else {
      console.log(`   ✅ ${key}: Set`);
    }
  });
  
  // Check important variables
  console.log('\n📋 Important Variables:');
  Object.entries(important).forEach(([key, value]) => {
    if (!value) {
      warnings.push(`${key} is not set (will use default)`);
      console.log(`   ⚠️  ${key}: NOT SET (will use default)`);
    } else {
      console.log(`   ✅ ${key}: ${value}`);
    }
  });
  
  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && nodeEnv !== 'production' && nodeEnv !== 'development' && nodeEnv !== 'test') {
    warnings.push(`NODE_ENV has unexpected value: ${nodeEnv}`);
  }
  
  // Check cookie settings compatibility
  console.log('\n🍪 Cookie Configuration:');
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`   Environment: ${isProduction ? 'production' : 'development'}`);
  console.log(`   Secure cookies: ${isProduction ? 'YES (HTTPS required)' : 'NO (HTTP allowed)'}`);
  console.log(`   SameSite: ${isProduction ? 'none (cross-site allowed)' : 'lax (same-site preferred)'}`);
  console.log(`   HttpOnly: YES (always enabled)`);
  console.log(`   Path: / (sent with all requests)`);
  
  if (isProduction && !process.env.CLIENT_URL?.startsWith('https://')) {
    warnings.push('Production mode but CLIENT_URL is not HTTPS - cookies may fail');
    console.log(`   ⚠️  CLIENT_URL should be HTTPS in production`);
  }
  
  // CORS check
  console.log('\n🌍 CORS Configuration:');
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
  const corsOrigins = process.env.CORS_ORIGINS;
  
  if (corsOrigins) {
    const origins = corsOrigins.split(',').map(o => o.trim());
    console.log(`   Allowed origins (${origins.length}):`);
    origins.forEach(origin => console.log(`      - ${origin}`));
    
    if (!origins.includes(clientUrl)) {
      warnings.push(`CLIENT_URL (${clientUrl}) is not in CORS_ORIGINS list`);
      console.log(`   ⚠️  CLIENT_URL not in CORS_ORIGINS - may cause CORS errors`);
    }
  } else {
    console.log(`   Using default origins (includes ${clientUrl})`);
  }
  
  // JWT expiry check
  console.log('\n🔐 JWT Configuration:');
  const accessExpiry = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  const refreshExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  console.log(`   Access token TTL: ${accessExpiry}`);
  console.log(`   Refresh token TTL: ${refreshExpiry}`);
  
  // Summary
  console.log('\n📊 Validation Summary:');
  if (issues.length === 0 && warnings.length === 0) {
    console.log('   ✅ All environment variables configured correctly!');
  } else {
    if (issues.length > 0) {
      console.log(`   ❌ ${issues.length} critical issue(s) found:`);
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    if (warnings.length > 0) {
      console.log(`   ⚠️  ${warnings.length} warning(s):`);
      warnings.forEach(warning => console.log(`      - ${warning}`));
    }
  }
  
  console.log('================================================\n');
  
  // Throw error if critical issues found
  if (issues.length > 0) {
    throw new Error(`Environment validation failed: ${issues.join(', ')}`);
  }
  
  return { warnings, issues };
};

module.exports = { validateEnvironment };
