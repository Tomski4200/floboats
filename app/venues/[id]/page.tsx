'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Users, ExternalLink, Clock, ChevronRight } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface VenueDetails {
  id: string
  slug?: string
  name: string
  address: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  zip_code: string
  capacity: number | null
  description: string | null
  parking_info: string | null
  amenities: any
  venue_type: string | null
  venue_contact_name: string | null
  venue_contact_phone: string | null
  venue_contact_email: string | null
  coordinates: any
  photos: string[] | null
}

interface VenueEvent {
  id: string
  slug?: string
  title: string
  short_description: string
  event_start: string
  event_end: string
  all_day: boolean
  cost: number
  cost_description: string
  featured_image_url: string
  is_featured: boolean
  attendee_count: number
  max_attendees: number | null
  status: string
  category: {
    name: string
    color_hex: string
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
    day: 'numeric',
    year: 'numeric'
  }
  
  if (allDay) {
    return startDate.toLocaleDateString('en-US', dateOptions)
  }
  
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: 'numeric', 
    minute: '2-digit' 
  }
  
  return `${startDate.toLocaleDateString('en-US', dateOptions)} • ${startDate.toLocaleTimeString('en-US', timeOptions)}`
}

export default function VenueDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const [venue, setVenue] = useState<VenueDetails | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<VenueEvent[]>([])
  const [pastEvents, setPastEvents] = useState<VenueEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  
  useEffect(() => {
    async function loadVenue() {
      const resolvedParams = await params
      const { id: idOrSlug } = resolvedParams
      
      const supabase = createBrowserClient()
      
      // Check if it's a UUID (ID) or slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
      
      // Fetch venue details
      let query = supabase.from('event_venues').select('*')
      
      if (isUUID) {
        query = query.eq('id', idOrSlug)
      } else {
        query = query.eq('slug', idOrSlug)
      }
      
      const { data: venueData, error: venueError } = await query.single()
      
      if (venueError || !venueData) {
        console.error('Error fetching venue:', venueError)
        console.error('Query details - idOrSlug:', idOrSlug, 'isUUID:', isUUID)
        console.error('Full error details:', JSON.stringify(venueError, null, 2))
        notFound()
      }
      
      setVenue(venueData)
      
      // Fetch events at this venue
      const currentDate = new Date().toISOString()
      
      // Upcoming events
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('events')
        .select(`
          id,
          slug,
          title,
          short_description,
          event_start,
          event_end,
          all_day,
          cost,
          cost_description,
          featured_image_url,
          is_featured,
          attendee_count,
          max_attendees,
          status,
          category:event_categories(
            name,
            color_hex
          ),
          organizer:businesses!organizer_business_id(
            business_name,
            slug
          )
        `)
        .eq('venue_id', venueData.id)
        .eq('status', 'published')
        .gte('event_start', currentDate)
        .order('event_start', { ascending: true })
      
      if (!upcomingError && upcomingData) {
        // Process events to handle array responses from Supabase joins
        const processedUpcomingEvents = upcomingData.map((event: any) => ({
          ...event,
          category: Array.isArray(event.category) ? event.category[0] : event.category,
          organizer: Array.isArray(event.organizer) ? event.organizer[0] : event.organizer
        }))
        setUpcomingEvents(processedUpcomingEvents)
      }
      
      // Past events
      const { data: pastData, error: pastError } = await supabase
        .from('events')
        .select(`
          id,
          slug,
          title,
          short_description,
          event_start,
          event_end,
          all_day,
          cost,
          cost_description,
          featured_image_url,
          is_featured,
          attendee_count,
          max_attendees,
          status,
          category:event_categories(
            name,
            color_hex
          ),
          organizer:businesses!organizer_business_id(
            business_name,
            slug
          )
        `)
        .eq('venue_id', venueData.id)
        .eq('status', 'published')
        .lt('event_start', currentDate)
        .order('event_start', { ascending: false })
        .limit(50)
      
      if (!pastError && pastData) {
        // Process events to handle array responses from Supabase joins
        const processedPastEvents = pastData.map((event: any) => ({
          ...event,
          category: Array.isArray(event.category) ? event.category[0] : event.category,
          organizer: Array.isArray(event.organizer) ? event.organizer[0] : event.organizer
        }))
        setPastEvents(processedPastEvents)
      }
      
      setLoading(false)
    }
    
    loadVenue()
  }, [params])
  
  if (loading) {
    return <div>Loading venue details...</div>
  }
  
  if (!venue) {
    return notFound()
  }
  
  const allEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{venue.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <MapPin className="h-5 w-5" />
                <span>{venue.city}, {venue.state}</span>
              </div>
              {venue.capacity && (
                <div className="flex items-center gap-2 mt-1 text-gray-600">
                  <Users className="h-5 w-5" />
                  <span>Capacity: {venue.capacity.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${venue.address} ${venue.city} ${venue.state} ${venue.zip_code}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Get Directions
                </a>
              </Button>
            </div>
          </div>
          
          {venue.description && (
            <p className="mt-4 text-gray-600 max-w-3xl">{venue.description}</p>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Events List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Events at {venue.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upcoming">
                      Upcoming ({upcomingEvents.length})
                    </TabsTrigger>
                    <TabsTrigger value="past">
                      Past ({pastEvents.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={activeTab} className="mt-6">
                    {allEvents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No {activeTab} events at this venue.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {allEvents.map((event) => (
                          <Link key={event.id} href={`/events/${event.slug || event.id}`}>
                            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge 
                                      variant="outline"
                                      style={{ borderColor: event.category.color_hex, color: event.category.color_hex }}
                                    >
                                      {event.category.name}
                                    </Badge>
                                    {event.is_featured && (
                                      <Badge variant="secondary" className="bg-yellow-500 text-black">
                                        Featured
                                      </Badge>
                                    )}
                                  </div>
                                  <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                                  <p className="text-gray-600 text-sm mb-2">{event.short_description}</p>
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>{formatEventDate(event.event_start, event.event_end, event.all_day)}</span>
                                    </div>
                                    {event.cost > 0 && (
                                      <span className="font-medium text-green-600">
                                        ${event.cost}
                                      </span>
                                    )}
                                    {event.organizer && (
                                      <span>by {event.organizer.business_name}</span>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Venue Info Sidebar */}
          <div className="space-y-6">
            {/* Location Card */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">{venue.address_line1 || venue.address}</p>
                    {venue.address_line2 && <p>{venue.address_line2}</p>}
                    <p>{venue.city}, {venue.state} {venue.zip_code}</p>
                  </div>
                  
                  {/* Map iframe */}
                  <div className="aspect-video rounded-lg overflow-hidden border -mx-6">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyARig3H0hg2_zqEE9LR3SdAxszfYLztAWs&q=${encodeURIComponent(
                        `${venue.address} ${venue.city} ${venue.state} ${venue.zip_code}`
                      )}`}
                      allowFullScreen
                    />
                  </div>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        `${venue.address} ${venue.city} ${venue.state} ${venue.zip_code}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Google Maps
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Venue Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Venue Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {venue.venue_type && (
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">{venue.venue_type}</p>
                    </div>
                  )}
                  
                  {venue.capacity && (
                    <div>
                      <p className="text-sm text-gray-500">Capacity</p>
                      <p className="font-medium">{venue.capacity.toLocaleString()} people</p>
                    </div>
                  )}
                  
                  {venue.parking_info && (
                    <div>
                      <p className="text-sm text-gray-500">Parking</p>
                      <p className="font-medium">{venue.parking_info}</p>
                    </div>
                  )}
                  
                  {venue.amenities && venue.amenities.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {venue.amenities.map((amenity: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Contact Card */}
            {(venue.venue_contact_name || venue.venue_contact_phone || venue.venue_contact_email) && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {venue.venue_contact_name && (
                      <div>
                        <p className="text-sm text-gray-500">Contact Person</p>
                        <p className="font-medium">{venue.venue_contact_name}</p>
                      </div>
                    )}
                    
                    {venue.venue_contact_phone && (
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <a href={`tel:${venue.venue_contact_phone}`} className="font-medium text-blue-600 hover:underline">
                          {venue.venue_contact_phone}
                        </a>
                      </div>
                    )}
                    
                    {venue.venue_contact_email && (
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <a href={`mailto:${venue.venue_contact_email}`} className="font-medium text-blue-600 hover:underline">
                          {venue.venue_contact_email}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}