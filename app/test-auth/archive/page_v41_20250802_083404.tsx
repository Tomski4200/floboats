'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'

export default function TestAuthPage() {
  interface ClientSession {
    access_token: string
    refresh_token: string
    expires_at?: number
    user: {
      id: string
      email?: string
      [key: string]: any
    }
  }

  const [clientSession, setClientSession] = useState<ClientSession | null>(null)
  const [cookies, setCookies] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const { user: contextUser, loading: contextLoading } = useAuth()
  
  const supabase = createBrowserClient()

  useEffect(() => {
    const checkEverything = async () => {
      // Check client-side session
      const { data: { session }, error } = await supabase.auth.getSession()
      setClientSession(session)
      
      // Check cookies
      setCookies(document.cookie)
      
      setLoading(false)
    }

    checkEverything()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session)
      setClientSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const testSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/test-auth`
      }
    })
    
    if (error) {
      console.error('Sign in error:', error)
      alert(`Sign in error: ${error.message}`)
    }
  }

  const testSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      alert(`Sign out error: ${error.message}`)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Auth Testing Page</h1>
        
        {/* Status Overview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Client Session:</span>
              <span className={`ml-2 ${clientSession ? 'text-green-600' : 'text-red-600'}`}>
                {clientSession ? '✅ Active' : '❌ None'}
              </span>
            </div>
            <div>
              <span className="font-medium">Context User:</span>
              <span className={`ml-2 ${contextUser ? 'text-green-600' : 'text-red-600'}`}>
                {contextUser ? '✅ Active' : '❌ None'}
              </span>
            </div>
            <div>
              <span className="font-medium">Loading State:</span>
              <span className="ml-2">
                Client: {loading ? '⏳' : '✅'}, Context: {contextLoading ? '⏳' : '✅'}
              </span>
            </div>
            <div>
              <span className="font-medium">Auth Cookies:</span>
              <span className="ml-2">
                {cookies.includes('sb-') ? '✅ Present' : '❌ Missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Direct Supabase Client Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Direct Supabase Client</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-2">
              <p><strong>Session:</strong> {clientSession ? 'Active' : 'None'}</p>
              {clientSession && (
                <>
                  <p><strong>User Email:</strong> {clientSession.user?.email}</p>
                  <p><strong>User ID:</strong> {clientSession.user?.id}</p>
                  <p><strong>Provider:</strong> {clientSession.user?.app_metadata?.provider}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Auth Context Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Auth Context</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {contextLoading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {contextUser ? 'Present' : 'None'}</p>
            {contextUser && (
              <>
                <p><strong>Email:</strong> {contextUser.email}</p>
                <p><strong>ID:</strong> {contextUser.id}</p>
              </>
            )}
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Cookies</h2>
          <div className="bg-gray-100 p-4 rounded text-sm font-mono overflow-x-auto">
            {cookies || 'No cookies found'}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-x-4">
            <button
              onClick={testSignIn}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Google Sign In
            </button>
            <button
              onClick={testSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Test Sign Out
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Refresh Page
            </button>
          </div>
        </div>

        {/* Console Instructions */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Debug Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>Open browser console (F12)</li>
            <li>Click "Test Google Sign In"</li>
            <li>Complete the Google auth flow</li>
            <li>Check the console for any errors</li>
            <li>This page will show current auth state</li>
          </ol>
        </div>
      </div>
    </div>
  )
}