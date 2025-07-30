const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://lvfshqpmvynjtdwlkupx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2ZnNocXBtdnluanRkd2xrdXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDM4NzMsImV4cCI6MjA2NDc3OTg3M30.nvrRJPer8bBYgtaoQGDeyH5G2vK1SBbBkuCvNFxyCcE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Try to query the profiles table to see if schema is deployed
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Profiles table not found or not accessible')
      console.log('Error:', error.message)
      
      // Check if it's a permission error or table doesn't exist
      if (error.message.includes('relation "public.profiles" does not exist')) {
        console.log('🚨 Schema has NOT been deployed yet')
        console.log('📋 Next steps:')
        console.log('1. Go to https://app.supabase.com')
        console.log('2. Open your FloBoats project')
        console.log('3. Navigate to SQL Editor')
        console.log('4. Copy the contents of floboats_schema.sql')
        console.log('5. Paste and run the entire schema')
      } else {
        console.log('🔧 Schema might be deployed but RLS policies need configuration')
      }
    } else {
      console.log('✅ Successfully connected to Supabase!')
      console.log('✅ Profiles table exists and is accessible')
      console.log('🎉 Schema appears to be deployed!')
    }
    
    // Also test business_categories table which has seed data
    const { data: categories, error: catError } = await supabase
      .from('business_categories')
      .select('name')
      .limit(5)
    
    if (!catError && categories?.length > 0) {
      console.log('✅ Business categories table exists with seed data:')
      categories.forEach(cat => console.log(`  - ${cat.name}`))
    }
    
  } catch (error) {
    console.error('💥 Connection test failed:', error.message)
  }
}

testConnection()