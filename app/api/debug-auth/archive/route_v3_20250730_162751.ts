import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  const authCookies = allCookies.filter(cookie => 
    cookie.name.includes('sb-') || 
    cookie.name.includes('auth')
  )

  return NextResponse.json({
    message: 'Auth Debug Endpoint',
    cookies: {
      total: allCookies.length,
      authRelated: authCookies.length,
      details: authCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        length: c.value?.length || 0
      }))
    },
    timestamp: new Date().toISOString()
  })
}