// Test script to verify auth refresh flow
// Run this in browser console when on localhost:8080

async function testAuthRefresh() {
  console.log('🧪 Testing authentication refresh flow...\n');
  
  // Step 1: Check current cookies
  console.log('📋 Step 1: Checking current cookies');
  const cookies = document.cookie;
  console.log('Cookies:', cookies);
  const hasAccessToken = cookies.includes('access_token');
  const hasRefreshToken = cookies.includes('refresh_token');
  console.log('  - Has access_token:', hasAccessToken);
  console.log('  - Has refresh_token:', hasRefreshToken);
  
  if (!hasRefreshToken) {
    console.log('❌ No refresh token found. Please log in first.');
    return;
  }
  
  // Step 2: Call refresh endpoint
  console.log('\n🔄 Step 2: Calling /api/auth/refresh');
  try {
    const refreshResponse = await fetch('http://localhost:3001/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('  - Status:', refreshResponse.status);
    const refreshData = await refreshResponse.json();
    console.log('  - Response:', refreshData);
    
    if (refreshResponse.ok) {
      console.log('  ✅ Refresh successful!');
    } else {
      console.log('  ❌ Refresh failed:', refreshData);
      return;
    }
  } catch (error) {
    console.log('  ❌ Refresh error:', error);
    return;
  }
  
  // Step 3: Check if access_token cookie was set
  console.log('\n🍪 Step 3: Checking if access_token was set');
  await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  const newCookies = document.cookie;
  const hasNewAccessToken = newCookies.includes('access_token');
  console.log('  - Has access_token now:', hasNewAccessToken);
  
  // Step 4: Try to call /api/auth/me
  console.log('\n👤 Step 4: Calling /api/auth/me');
  try {
    const meResponse = await fetch('http://localhost:3001/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('  - Status:', meResponse.status);
    const meData = await meResponse.json();
    
    if (meResponse.ok) {
      console.log('  ✅ Successfully retrieved user data!');
      console.log('  - User:', meData.user.email);
    } else {
      console.log('  ❌ Failed to get user:', meData);
    }
  } catch (error) {
    console.log('  ❌ Error:', error);
  }
  
  console.log('\n✅ Test complete!');
}

// Run the test
testAuthRefresh();
