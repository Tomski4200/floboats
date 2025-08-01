// Test our Supabase client configuration
const { createBrowserSupabaseClient } = require('./lib/supabase.ts')

async function testSupabaseClient() {
  try {
    console.log('🧪 Testing Supabase client configuration...')
    
    const supabase = createBrowserSupabaseClient()
    
    // Test connection with business categories
    const { data: categories, error } = await supabase
      .from('business_categories')
      .select('name, description')
      .limit(3)
    
    if (error) {
      console.error('❌ Error:', error.message)
      return
    }
    
    console.log('✅ Supabase client working!')
    console.log('📋 Sample business categories:')
    categories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.description}`)
    })
    
    // Test profiles table access
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (!countError) {
      console.log(`✅ Profiles table accessible (${count} profiles)`)
    }
    
    console.log('🎉 Client configuration test passed!')
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

testSupabaseClient()