import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        userError: userError?.message 
      }, { status: 401 })
    }

    // Try to get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Also check if any profiles exist
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile || null,
      profileError: profileError?.message || null,
      totalProfiles: count,
      debug: {
        hasProfile: !!profile,
        profileTableAccessible: !profileError || profileError.code !== '42501'
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}