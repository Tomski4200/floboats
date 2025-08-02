import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Auth status error:', error)
      return NextResponse.json({ 
        error: error.message,
        session: null,
        user: null 
      }, { status: 500 })
    }

    return NextResponse.json({
      session: session ? {
        access_token: 'present',
        expires_at: session.expires_at,
        user_id: session.user?.id
      } : null,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        provider: session.user.app_metadata?.provider
      } : null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}