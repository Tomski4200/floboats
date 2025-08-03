import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Heart, Calendar, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

// TODO: Add user boat listings
// TODO: Add recent activity feed
// TODO: Add favorite listings
// TODO: Add profile completion prompts

interface LikedEventItem {
  event: {
    id: string
    slug: string
    title: string
    event_start: string
    all_day: boolean
    location_city: string
    location_state: string
    venue: { name: string } | null
  } | null
}

export default async function DashboardPage() {
  let user = null
  let profile = null
  let likedEventsCount = 0
  let upcomingLikedEvents: LikedEventItem[] = []
  
  try {
    const supabase = await createServerClient()
    
    // Check if user is authenticated
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authData?.user) {
      redirect('/login')
    }
    
    user = authData.user
    
    // Get user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      
    profile = profileData
    
    // Get liked events count and upcoming events
    const { count } = await supabase
      .from('event_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    likedEventsCount = count || 0
    
    // Get upcoming liked events (next 3)
    const { data: likedEvents } = await supabase
      .from('event_likes')
      .select(`
        event:events(
          id,
          slug,
          title,
          event_start,
          all_day,
          location_city,
          location_state,
          venue:event_venues(name)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (likedEvents) {
      // Handle array returns from Supabase joins
      const processedEvents = likedEvents.map(item => {
        const event = Array.isArray(item.event) ? item.event[0] : item.event
        if (!event) return null
        
        return {
          event: {
            ...event,
            venue: Array.isArray(event.venue) ? event.venue[0] : event.venue
          }
        }
      }).filter(Boolean) as LikedEventItem[]
      
      // Filter for upcoming events and take the first 3
      const now = new Date().toISOString()
      upcomingLikedEvents = processedEvents
        .filter(item => item.event !== null && item.event.event_start >= now)
        .sort((a, b) => {
          // TypeScript needs these assertions even though we filtered for non-null
          if (!a.event || !b.event) return 0
          return new Date(a.event.event_start).getTime() - new Date(b.event.event_start).getTime()
        })
        .slice(0, 3)
    }
  } catch (error) {
    console.error('Dashboard error:', error)
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{profile?.name ? `, ${profile.name}` : ''}!
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.email}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/boats/new" className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">List Your</p>
                <p className="text-xl font-bold">Boat</p>
              </div>
              <span className="text-3xl">⛵</span>
            </div>
          </Link>
          
          <Link href="/marketplace" className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Browse</p>
                <p className="text-xl font-bold">Marketplace</p>
              </div>
              <span className="text-3xl">🛒</span>
            </div>
          </Link>
          
          <Link href="/events" className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Discover</p>
                <p className="text-xl font-bold">Events</p>
              </div>
              <span className="text-3xl">📅</span>
            </div>
          </Link>
          
          <Link href="/profile" className="bg-orange-600 text-white p-6 rounded-lg hover:bg-orange-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Edit Your</p>
                <p className="text-xl font-bold">Profile</p>
              </div>
              <span className="text-3xl">👤</span>
            </div>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Liked Events Section */}
            {likedEventsCount > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500 fill-current" />
                    <h2 className="text-xl font-bold text-gray-900">Liked Events</h2>
                    <span className="text-sm text-gray-500">({likedEventsCount})</span>
                  </div>
                  <Link href="/dashboard/liked-events" className="text-blue-600 hover:text-blue-700 text-sm">
                    View all →
                  </Link>
                </div>
                {upcomingLikedEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingLikedEvents.map((item: any) => (
                      <Link 
                        key={item.event.id} 
                        href={`/events/${item.event.slug || item.event.id}`}
                        className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="font-medium text-gray-900 mb-1">{item.event.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(item.event.event_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{item.event.venue?.name || `${item.event.location_city}, ${item.event.location_state}`}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No upcoming events in your liked list</p>
                )}
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="text-gray-500 text-center py-8">
                <p>No recent activity to show</p>
                <Link href="/marketplace" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
                  Start browsing boats →
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Completion */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Status</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Email verified</span>
                </div>
                {(profile?.first_name && profile?.last_name) ? (
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">Name added</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-2">○</span>
                    <span className="text-gray-500">Add your name</span>
                  </div>
                )}
                {profile?.avatar_url ? (
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">Profile photo added</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-2">○</span>
                    <span className="text-gray-500">Add profile photo</span>
                  </div>
                )}
                {profile?.bio ? (
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">Bio added</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-2">○</span>
                    <span className="text-gray-500">Add bio</span>
                  </div>
                )}
              </div>
              <Link href="/profile" className="mt-4 block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
                Complete Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}