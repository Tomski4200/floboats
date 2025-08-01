'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export default function AuthDebugPage() {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createBrowserClient()

  useEffect(() => {
    const checkAuth = async () => {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('Session:', session)
      console.log('Error:', error)
      
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event)
      console.log('Auth session:', session)
      setSession(session)
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="p-8">Loading auth state...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">User Status:</h2>
          <p className="text-lg">{user ? '✅ Signed In' : '❌ Not Signed In'}</p>
        </div>

        {user && (
          <div>
            <h2 className="text-lg font-semibold">User Info:</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}

        {session && (
          <div>
            <h2 className="text-lg font-semibold">Session Info:</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({
                access_token: session.access_token ? 'Present' : 'Missing',
                refresh_token: session.refresh_token ? 'Present' : 'Missing',
                expires_at: session.expires_at,
                user_id: session.user?.id
              }, null, 2)}
            </pre>
          </div>
        )}

        <div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-2"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}