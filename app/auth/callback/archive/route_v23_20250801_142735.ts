import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    try {
      const supabase = await createServerClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
      }

      // Check if user exists in profiles table
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          // Create profile if it doesn't exist
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              username: user.email?.split('@')[0] || `user${user.id.slice(0, 8)}`, // Generate username from email
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (createError) {
            console.error('Profile creation error:', createError)
          }
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}