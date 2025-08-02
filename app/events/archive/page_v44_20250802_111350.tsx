import Link from 'next/link'
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'

interface EventListing {
  id: string
  slug?: string
  title: string
  short_description: string
  event_start: string
  event_end: string
  all_day: boolean
  location_name: string
  location_city: string
  location_state: string
  cost: number
  cost_description: string
  max_attendees: number
  featured_image_url: string
  is_featured: boolean
  attendee_count: number
  organizer_business_id: string | null
  category: {
    name: string
    color_hex: string
    icon: string
  }
  organizer: {
    business_name: string
    slug: string
  } | null
}

function formatEventDate(start: string, end: string | null, allDay: boolean) {
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : null
  
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }
  
  if (allDay) {
    if (endDate && startDate.toDateString() !== endDate.toDateString()) {
      return `${startDate.toLocaleDateString('en-US', dateOptions)} - ${endDate.toLocaleDateString('en-US', dateOptions)}`
    }
    return startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }
  
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: 'numeric', 
    minute: '2-digit' 
  }
  
  if (endDate && startDate.toDateString() === endDate.toDateString()) {
    return `${startDate.toLocaleDateString('en-US', dateOptions)} • ${startDate.toLocaleTimeString('en-US', timeOptions)} - ${endDate.toLocaleTimeString('en-US', timeOptions)}`
  }
  
  return `${startDate.toLocaleDateString('en-US', dateOptions)} • ${startDate.toLocaleTimeString('en-US', timeOptions)}`
}

async function getEvents() {
  const supabase = await createServerClient()
  
  const currentDate = new Date()
  console.log('Current date:', currentDate.toISOString())
  console.log('Filtering for events after:', currentDate.toISOString())
  
  try {
    // First, try without the organizer join
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        slug,
        title,
        short_description,
        event_start,
        event_end,
        all_day,
        location_name,
        location_city,
        location_state,
        cost,
        cost_description,
        max_attendees,
        featured_image_url,
        is_featured,
        attendee_count,
        organizer_business_id,
        category:event_categories(
          name,
          color_hex,
          icon
        )
      `)
      .eq('event_visibility', 'public')
      .eq('status', 'published')
      .eq('approval_status', 'approved')
      .gte('event_start', currentDate.toISOString())
      .order('event_start', { ascending: true })
      .limit(20)
    
    if (error) {
      console.error('Error fetching events:', error)
      return []
    }
    
    console.log('Events fetched:', events?.length || 0)
    if (events && events.length > 0) {
      console.log('First event date:', events[0].event_start)
      console.log('Sample event organizer_business_id:', events[0].organizer_business_id)
      console.log('Event IDs:', events.map(e => ({ id: e.id, title: e.title })))
    }
    
    // Now fetch organizer details separately for events that have them
    const eventsWithOrganizers = await Promise.all(
      events.map(async (event) => {
        if (event.organizer_business_id) {
          const { data: organizer } = await supabase
            .from('businesses')
            .select('business_name, slug')
            .eq('id', event.organizer_business_id)
            .single()
          
          return { ...event, organizer }
        }
        return { ...event, organizer: null }
      })
    )
    
    return eventsWithOrganizers || []
  } catch (error) {
    console.error('Unexpected error in getEvents:', error)
    return []
  }
}

export default async function EventsPage() {
  const events = await getEvents()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Marine Events</h1>
              <p className="mt-2 text-gray-600">
                Discover boat shows, fishing tournaments, and marine events across Florida
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </Button>
              <Link href="/dashboard/events/new">
                <Button>
                  Create Event
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4">
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">All Categories</option>
              <option value="boat-shows">Boat Shows</option>
              <option value="fishing-tournaments">Fishing Tournaments</option>
              <option value="regattas">Regattas & Races</option>
              <option value="marina-events">Marina Events</option>
              <option value="educational">Educational</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">All Locations</option>
              <option value="miami">Miami</option>
              <option value="fort-lauderdale">Fort Lauderdale</option>
              <option value="tampa">Tampa</option>
              <option value="key-west">Key West</option>
              <option value="jacksonville">Jacksonville</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="">Any Price</option>
              <option value="free">Free</option>
              <option value="under-50">Under $50</option>
              <option value="50-100">$50 - $100</option>
              <option value="over-100">Over $100</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
            <p className="text-gray-600">Check back soon for new marine events in Florida!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.slug || event.id}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  {event.featured_image_url && (
                    <div className="h-48 overflow-hidden rounded-t-lg">
                      <Image
                        src={event.featured_image_url}
                        alt={event.title}
                        width={400}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      {event.category && (
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: event.category.color_hex,
                            color: event.category.color_hex 
                          }}
                        >
                          {event.category.name}
                        </Badge>
                      )}
                      {event.is_featured && (
                        <Badge variant="secondary" className="bg-yellow-100">
                          Featured
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                    
                    {event.short_description && (
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {event.short_description}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatEventDate(event.event_start, event.event_end, event.all_day)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {event.location_name || `${event.location_city}, ${event.location_state}`}
                        </span>
                      </div>
                      
                      {event.organizer && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>by {event.organizer.business_name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          {event.cost === 0 ? 'Free' : event.cost_description || `$${event.cost}`}
                        </span>
                      </div>
                    </div>
                    
                    {event.max_attendees && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {event.attendee_count} / {event.max_attendees} attending
                          </span>
                          {event.attendee_count >= event.max_attendees && (
                            <Badge variant="secondary">Full</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}