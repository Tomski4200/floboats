const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = 'https://lvfshqpmvynjtdwlkupx.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2ZnNocXBtdnluanRkd2xrdXB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIwMzg3MywiZXhwIjoyMDY0Nzc5ODczfQ.GEkLBX_J904vyuMZEzcB9I_8VH1TihhH8Dni1-HAHrk'

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function deploySchema() {
  try {
    console.log('🚀 Starting schema deployment...')
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'floboats_schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📖 Schema file read successfully')
    console.log(`📊 Schema size: ${schemaSql.length} characters`)
    
    // Split the schema into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`🔧 Found ${statements.length} SQL statements`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        })
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
          console.log('Statement:', statement.substring(0, 100) + '...')
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message)
      }
    }
    
    console.log('🎉 Schema deployment completed!')
    
    // Test the deployment by checking if tables exist
    console.log('🔍 Verifying deployment...')
    const { data: tables, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      })
    
    if (tableError) {
      console.error('❌ Error verifying tables:', tableError.message)
    } else {
      console.log('✅ Tables created successfully!')
      console.log('📋 Created tables:', tables?.map(t => t.table_name))
    }
    
  } catch (error) {
    console.error('💥 Deployment failed:', error.message)
    process.exit(1)
  }
}

deploySchema()