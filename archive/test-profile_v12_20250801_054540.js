const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local file manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== Supabase Profile Test Script ===\n');

// Check environment variables
console.log('1. Environment Check:');
console.log('   - SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('   - ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
console.log('   - SERVICE_ROLE_KEY:', serviceRoleKey ? '✓ Set' : '✗ Missing');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Missing required environment variables!');
  process.exit(1);
}

// Create clients
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

async function testProfileAccess() {
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('2. Connection Test:');
    const { data: healthData, error: healthError } = await anonClient
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('   - Connection:', '✗ Failed');
      console.log('   - Error:', healthError.message);
    } else {
      console.log('   - Connection:', '✓ Success');
    }
    console.log('');

    // Test 2: Check current auth status
    console.log('3. Auth Status Check (Anon Client):');
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    
    if (authError) {
      console.log('   - Auth Status:', '✗ Error');
      console.log('   - Error:', authError.message);
    } else if (!user) {
      console.log('   - Auth Status:', '✗ Not authenticated');
      console.log('   - Note: This is expected for a server-side script without session');
    } else {
      console.log('   - Auth Status:', '✓ Authenticated');
      console.log('   - User ID:', user.id);
      console.log('   - Email:', user.email);
    }
    console.log('');

    // Test 3: Query profiles table structure
    console.log('4. Profiles Table Structure:');
    if (adminClient) {
      // Use admin client to check table structure
      const { data: sampleProfile, error: sampleError } = await adminClient
        .from('profiles')
        .select('*')
        .limit(1)
        .single();
      
      if (sampleError && sampleError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.log('   - Table Access:', '✗ Error');
        console.log('   - Error:', sampleError.message);
      } else if (sampleProfile) {
        console.log('   - Table Access:', '✓ Success');
        console.log('   - Sample Profile Fields:', Object.keys(sampleProfile).join(', '));
      } else {
        console.log('   - Table Access:', '✓ Success (but no profiles exist)');
      }
    } else {
      console.log('   - Skipping (no service role key)');
    }
    console.log('');

    // Test 4: Check if any profiles exist
    console.log('5. Profile Records Check:');
    if (adminClient) {
      const { count, error: countError } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log('   - Count Query:', '✗ Error');
        console.log('   - Error:', countError.message);
      } else {
        console.log('   - Total Profiles:', count || 0);
      }

      // List first 5 profiles (anonymized)
      const { data: profiles, error: listError } = await adminClient
        .from('profiles')
        .select('id, username, created_at')
        .limit(5);
      
      if (!listError && profiles && profiles.length > 0) {
        console.log('   - Sample Profiles:');
        profiles.forEach(p => {
          console.log(`     - ${p.id.substring(0, 8)}... | @${p.username} | Created: ${new Date(p.created_at).toLocaleDateString()}`);
        });
      }
    } else {
      console.log('   - Skipping (no service role key)');
    }
    console.log('');

    // Test 5: Test a specific user ID if provided as command line argument
    const testUserId = process.argv[2];
    if (testUserId) {
      console.log(`6. Testing Specific User ID: ${testUserId}`);
      
      // Try with anon client first
      const { data: anonProfile, error: anonError } = await anonClient
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();
      
      console.log('   - Anon Client Query:');
      if (anonError) {
        console.log('     - Result:', '✗ Error');
        console.log('     - Error Code:', anonError.code);
        console.log('     - Error Message:', anonError.message);
        console.log('     - Error Details:', JSON.stringify(anonError.details, null, 2));
      } else if (anonProfile) {
        console.log('     - Result:', '✓ Success');
        console.log('     - Username:', anonProfile.username);
      } else {
        console.log('     - Result:', '✗ No profile found');
      }

      // Try with admin client if available
      if (adminClient) {
        const { data: adminProfile, error: adminError } = await adminClient
          .from('profiles')
          .select('*')
          .eq('id', testUserId)
          .single();
        
        console.log('   - Admin Client Query:');
        if (adminError) {
          console.log('     - Result:', '✗ Error');
          console.log('     - Error Code:', adminError.code);
          console.log('     - Error Message:', adminError.message);
        } else if (adminProfile) {
          console.log('     - Result:', '✓ Success');
          console.log('     - Profile Data:', JSON.stringify(adminProfile, null, 2));
        } else {
          console.log('     - Result:', '✗ No profile found');
        }
      }
    } else {
      console.log('6. Specific User Test: Skipped (no user ID provided)');
      console.log('   - To test a specific user, run: node test-profile.js <user-id>');
    }
    console.log('');

    // Test 6: Check RLS policies
    console.log('7. Row Level Security (RLS) Check:');
    console.log('   - Testing if anon users can read profiles...');
    const { data: rlsTest, error: rlsError } = await anonClient
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (rlsError) {
      console.log('   - RLS Test:', '✗ Cannot read profiles');
      console.log('   - This might indicate RLS policies are blocking access');
      console.log('   - Error:', rlsError.message);
    } else {
      console.log('   - RLS Test:', '✓ Can read profiles');
    }

    // Test 7: Call the test-profile API endpoint
    console.log('\n8. API Test Profile Endpoint:');
    console.log('   - Note: This requires the Next.js server to be running');
    console.log('   - To test: Start the server and visit http://localhost:3000/api/test-profile');
    console.log('   - Or run: curl http://localhost:3000/api/test-profile');

  } catch (error) {
    console.error('\nUnexpected error:', error);
  }
}

// Run the test
testProfileAccess().then(() => {
  console.log('\n=== Test Complete ===');
}).catch(error => {
  console.error('\nFatal error:', error);
  process.exit(1);
});