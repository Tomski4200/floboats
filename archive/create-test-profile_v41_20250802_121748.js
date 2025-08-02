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
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Missing required environment variables!');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestProfile() {
  const userId = process.argv[2];
  const email = process.argv[3];

  if (!userId) {
    console.log('Usage: node create-test-profile.js <user-id> [email]');
    console.log('');
    console.log('To find your user ID:');
    console.log('1. Login to your app');
    console.log('2. Visit /auth-debug page');
    console.log('3. Copy the user ID from the debug info');
    console.log('');
    
    // List existing auth users if we can
    console.log('Checking for existing auth users...');
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (!error && users && users.length > 0) {
        console.log('\nFound auth users:');
        users.forEach(user => {
          console.log(`- ID: ${user.id}`);
          console.log(`  Email: ${user.email || 'No email'}`);
          console.log(`  Created: ${new Date(user.created_at).toLocaleDateString()}`);
          console.log('');
        });
      } else if (error) {
        console.log('Could not list users:', error.message);
      } else {
        console.log('No auth users found.');
      }
    } catch (e) {
      console.log('Error listing users:', e.message);
    }
    
    return;
  }

  console.log(`Creating profile for user ID: ${userId}`);
  
  // First check if profile already exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existingProfile) {
    console.log('Profile already exists:');
    console.log(JSON.stringify(existingProfile, null, 2));
    return;
  }

  // Create a new profile
  const username = `user_${userId.substring(0, 8)}`;
  const profileData = {
    id: userId,
    username: username,
    first_name: 'Test',
    last_name: 'User',
    bio: 'This is a test profile created for debugging purposes.',
    location: 'Fort Lauderdale, FL',
    phone: '+1 (555) 123-4567',
    website: 'https://example.com',
    is_dealer: false,
    reputation_score: 0
  };

  console.log('\nCreating profile with data:');
  console.log(JSON.stringify(profileData, null, 2));

  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();

  if (insertError) {
    console.error('\nError creating profile:', insertError.message);
    console.error('Error details:', JSON.stringify(insertError, null, 2));
    
    // If username conflict, try with a different username
    if (insertError.code === '23505' && insertError.message.includes('username')) {
      console.log('\nUsername already exists, trying with timestamp...');
      profileData.username = `user_${Date.now()}`;
      
      const { data: retryProfile, error: retryError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
        
      if (retryError) {
        console.error('Retry failed:', retryError.message);
      } else {
        console.log('\n✅ Profile created successfully with username:', profileData.username);
        console.log(JSON.stringify(retryProfile, null, 2));
      }
    }
  } else {
    console.log('\n✅ Profile created successfully!');
    console.log(JSON.stringify(newProfile, null, 2));
  }
}

createTestProfile().catch(console.error);