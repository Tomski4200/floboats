import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, MapPin, Heart, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface LikedEvent {
  id: string
  created_at: string
  event: {
    id: string
    slug: string
    title: string
    short_description: string
    event_start: string
    event_end: string
    all_day: boolean
    location_city: string
    location_state: string
    featured_image_url: string
    status: string
    category: {
      name: string
      color_hex: string
    }
    venue: {
      name: string
    } | null
    organizer: {
      business_name: string
    } | null
  }
}

function formatEventDate(start: string, end: string | null, allDay: boolean) {
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : null
  
  const dateOptions: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  }
  
  if (allDay) {
    if (endDate && startDate.toDateString() !== endDate.toDateString()) {
      return `${startDate.toLocaleDateString('en-US', dateOptions)} - ${endDate.toLocaleDateString('en-US', dateOptions)}`
    }
    return startDate.toLocaleDateString('en-US', dateOptions)
  }
  
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: 'numeric', 
    minute: '2-digit' 
  }
  
  const dateStr = startDate.toLocaleDateString('en-US', dateOptions)
  const timeStr = startDate.toLocaleTimeString('en-US', timeOptions)
  
  return `${dateStr} at ${timeStr}`
}

export default async function LikedEventsPage() {
  let user = null
  let likedEvents: LikedEvent[] = []
  
  try {
    const supabase = await createServerClient()
    
    // Check if user is authenticated
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authData?.user) {
      redirect('/login')
    }
    
    user = authData.user
    
    // Get user's liked events
    const { data: likesData, error: likesError } = await supabase
      .from('event_likes')
      .select(`
        id,
        created_at,
        event:events(
          id,
          slug,
          title,
          short_description,
          event_start,
          event_end,
          all_day,
          location_city,
          location_state,
          featured_image_url,
          status,
          category:event_categories(
            name,
            color_hex
          ),
          venue:event_venues(
            name
          ),
          organizer:businesses!organizer_business_id(
            business_name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (likesError) {
      console.error('Error fetching liked events:', likesError)
    } else {
      likedEvents = likesData || []
    }
  } catch (error) {
    console.error('Liked events page error:', error)
    redirect('/login')
  }

  const upcomingEvents = likedEvents.filter(like => 
    like.event && new Date(like.event.event_start) > new Date()
  )
  
  const pastEvents = likedEvents.filter(like => 
    like.event && new Date(like.event.event_start) <= new Date()
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            <h1 className="text-3xl font-bold text-gray-900">Liked Events</h1>
          </div>
          <p className="text-gray-600 mt-2">Events you've shown interest in</p>
        </div>

        {likedEvents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No liked events yet</h3>
              <p className="text-gray-600 mb-4">
                Start exploring and like events that interest you!
              </p>
              <Link href="/events">
                <Button>Browse Events</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((like) => (
                    <Link 
                      key={like.id} 
                      href={`/events/${like.event.slug || like.event.id}`}
                      className="block"
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow">
                        {like.event.featured_image_url && (
                          <div className="aspect-video relative overflow-hidden rounded-t-lg">
                            <img 
                              src={like.event.featured_image_url} 
                              alt={like.event.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <Badge 
                              variant="outline"
                              style={{ borderColor: like.event.category.color_hex, color: like.event.category.color_hex }}
                            >
                              {like.event.category.name}
                            </Badge>
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                          </div>
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                            {like.event.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {like.event.short_description}
                          </p>
                          <div className="space-y-1 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatEventDate(like.event.event_start, like.event.event_end, like.event.all_day)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">
                                {like.event.venue?.name || `${like.event.location_city}, ${like.event.location_state}`}
                              </span>
                            </div>
                          </div>
                          {like.event.organizer && (
                            <p className="text-sm text-gray-500 mt-2">
                              by {like.event.organizer.business_name}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.map((like) => (
                    <Link 
                      key={like.id} 
                      href={`/events/${like.event.slug || like.event.id}`}
                      className="block opacity-75 hover:opacity-100 transition-opacity"
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow">
                        {like.event.featured_image_url && (
                          <div className="aspect-video relative overflow-hidden rounded-t-lg">
                            <img 
                              src={like.event.featured_image_url} 
                              alt={like.event.title}
                              className="object-cover w-full h-full grayscale"
                            />
                            <div className="absolute inset-0 bg-gray-900/20" />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="secondary">
                              Past Event
                            </Badge>
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                          </div>
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                            {like.event.title}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatEventDate(like.event.event_start, like.event.event_end, like.event.all_day)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">
                                {like.event.venue?.name || `${like.event.location_city}, ${like.event.location_state}`}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}