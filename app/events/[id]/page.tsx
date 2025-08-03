'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Clock, Users, DollarSign, Share2, Heart, ChevronRight, Globe, Phone, Mail, ExternalLink, Shield } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'

interface EventDetails {
  id: string
  slug: string
  title: string
  short_description: string
  long_description: string
  event_start: string
  event_end: string
  all_day: boolean
  location_name: string
  location_address: string
  location_city: string
  location_state: string
  location_zip: string
  latitude: number
  longitude: number
  virtual_meeting_url: string
  cost: number
  cost_description: string
  max_attendees: number
  registration_url: string
  featured_image_url: string
  is_featured: boolean
  event_visibility: string
  status: string
  approval_status: string
  attendee_count: number
  created_at: string
  category: {
    name: string
    color_hex: string
    icon: string
    description: string
  }
  organizer: {
    id: string
    business_name: string
    slug: string
    short_description: string
    logo_url: string
    phone: string
    email: string
    website_url: string
    verification_status: string
  } | null
  venue: {
    id: string
    slug?: string
    name: string
    address: string
    city: string
    state: string
    zip_code: string
    description: string
    capacity: number
  } | null
  photos: Array<{
    id: string
    photo_url: string
    caption: string
  }>
  associated_businesses: Array<{
    business: {
      id: string
      business_name: string
      slug: string
      logo_url: string
    }
    association_type: string
  }>
}

function formatEventDate(start: string, end: string | null, allDay: boolean) {
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : null
  
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric',
    month: 'long', 
    day: 'numeric' 
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
  
  if (endDate) {
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${startDate.toLocaleDateString('en-US', dateOptions)} • ${startDate.toLocaleTimeString('en-US', timeOptions)} - ${endDate.toLocaleTimeString('en-US', timeOptions)}`
    } else {
      return `${startDate.toLocaleDateString('en-US', dateOptions)} ${startDate.toLocaleTimeString('en-US', timeOptions)} - ${endDate.toLocaleDateString('en-US', dateOptions)} ${endDate.toLocaleTimeString('en-US', timeOptions)}`
    }
  }
  
  return `${startDate.toLocaleDateString('en-US', dateOptions)} • ${startDate.toLocaleTimeString('en-US', timeOptions)}`
}

async function getEvent(idOrSlug: string) {
  console.log('Fetching event with ID or slug:', idOrSlug)
  const supabase = createBrowserClient()
  
  // First try to fetch by slug, then by ID
  let query = supabase
    .from('events')
    .select(`
      *,
      category:event_categories(
        name,
        color_hex,
        icon,
        description
      ),
      organizer:businesses!organizer_business_id(
        id,
        business_name,
        slug,
        short_description,
        logo_url,
        phone,
        email,
        website_url,
        verification_status
      ),
      venue:event_venues!venue_id(
        id,
        slug,
        name,
        address,
        city,
        state,
        zip_code,
        description,
        capacity
      ),
      photos:event_photos(
        id,
        photo_url,
        caption
      ),
      associated_businesses:event_business_associations(
        business:businesses!business_id(
          id,
          business_name,
          slug,
          logo_url
        ),
        association_type
      )
    `)
  
  // Check if it's a UUID (ID) or slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
  
  let event = null
  let error = null
  
  if (isUUID) {
    const result = await query.eq('id', idOrSlug).single()
    event = result.data
    error = result.error
  } else {
    // Try slug first, then fall back to ID if slug column doesn't exist
    const slugResult = await query.eq('slug', idOrSlug).single()
    
    if (slugResult.error?.code === '42703') {
      // Column doesn't exist error - try as ID instead
      console.log('Slug column does not exist, falling back to ID query')
      const idResult = await supabase
        .from('events')
        .select(`
          *,
          category:event_categories(
            name,
            color_hex,
            icon,
            description
          ),
          organizer:businesses!organizer_business_id(
            id,
            business_name,
            slug,
            short_description,
            logo_url,
            phone,
            email,
            website_url,
            verification_status
          ),
          venue:event_venues!venue_id(
            id,
            name,
            address,
            city,
            state,
            zip_code,
            description,
            capacity
          ),
          photos:event_photos(
            id,
            photo_url,
            caption
          ),
          associated_businesses:event_business_associations(
            business:businesses!business_id(
              id,
              business_name,
              slug,
              logo_url
            ),
            association_type
          )
        `)
        .eq('id', idOrSlug)
        .single()
      
      event = idResult.data
      error = idResult.error
    } else {
      event = slugResult.data
      error = slugResult.error
    }
  }
  
  if (error) {
    console.error('Error fetching event:', error)
    console.error('Query details - idOrSlug:', idOrSlug, 'isUUID:', isUUID)
    console.error('Full error details:', JSON.stringify(error, null, 2))
    return null
  }
  
  if (!event) {
    console.log('No event found with ID/slug:', idOrSlug)
    return null
  }
  
  console.log('Event found:', event.title)
  console.log('Event venue:', event.venue)
  
  // Process event to handle array responses from Supabase joins
  const processedEvent = {
    ...event,
    category: Array.isArray(event.category) ? event.category[0] : event.category,
    organizer: Array.isArray(event.organizer) ? event.organizer[0] : event.organizer,
    venue: Array.isArray(event.venue) ? event.venue[0] : event.venue,
    photos: Array.isArray(event.photos) ? event.photos : (event.photos || []),
    associated_businesses: event.associated_businesses?.map((assoc: any) => ({
      ...assoc,
      business: Array.isArray(assoc.business) ? assoc.business[0] : assoc.business
    })) || []
  }
  
  return processedEvent as EventDetails
}

export default function EventDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isAttending, setIsAttending] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  
  useEffect(() => {
    async function loadEvent() {
      const resolvedParams = await params
      const { id } = resolvedParams
      console.log('Loading event with ID:', id)
      
      const eventData = await getEvent(id)
      
      if (!eventData) {
        console.log('Event not found')
        notFound()
      }
      
      setEvent(eventData)
      setLoading(false)
      console.log('Event state set, venue:', eventData.venue)
      
      // Check if user has liked or is attending
      if (user) {
        checkUserInteractions(id)
      }
    }
    
    loadEvent()
  }, [params, user])
  
  async function checkUserInteractions(eventId: string) {
    if (!user) return
    
    const supabase = createBrowserClient()
    
    // Check if user has liked the event
    const { data: likeData } = await supabase
      .from('event_likes')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()
    
    if (likeData) {
      setIsLiked(true)
    }
    
    // Check if user is attending
    const { data: attendeeData } = await supabase
      .from('event_attendees')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()
    
    if (attendeeData) {
      setIsAttending(true)
    }
  }
  
  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.short_description,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied!",
        description: "Event link has been copied to your clipboard.",
      })
    }
  }
  
  async function handleLike() {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like events.",
        variant: "destructive",
      })
      return
    }
    
    const supabase = createBrowserClient()
    
    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from('event_likes')
        .delete()
        .eq('event_id', event?.id)
        .eq('user_id', user.id)
      
      if (!error) {
        setIsLiked(false)
        toast({
          title: "Removed from favorites",
          description: "Event removed from your favorites.",
        })
      }
    } else {
      // Like
      const { error } = await supabase
        .from('event_likes')
        .insert([{
          event_id: event?.id,
          user_id: user.id
        }])
      
      if (!error) {
        setIsLiked(true)
        toast({
          title: "Added to favorites!",
          description: "Event added to your favorites.",
        })
      }
    }
  }
  
  function generateICS() {
    if (!event) return
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    }
    
    const startDate = new Date(event.event_start)
    const endDate = event.event_end ? new Date(event.event_end) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // Default 2 hours
    
    const location = event.venue 
      ? `${event.venue.name}, ${event.venue.address}, ${event.venue.city}, ${event.venue.state} ${event.venue.zip_code}`
      : `${event.location_name || ''}, ${event.location_address || ''}, ${event.location_city}, ${event.location_state} ${event.location_zip}`
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FloBoats//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${event.id}@floboats.com
DTSTART:${event.all_day ? formatDate(startDate).split('T')[0] : formatDate(startDate)}
DTEND:${event.all_day ? formatDate(endDate).split('T')[0] : formatDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.short_description}${event.registration_url ? `\\n\\nRegister: ${event.registration_url}` : ''}
LOCATION:${location.replace(/,\s*,/g, ',')}
URL:${window.location.href}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  async function handleAttend() {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to attend events.",
        variant: "destructive",
      })
      return
    }
    
    const supabase = createBrowserClient()
    
    if (isAttending) {
      // Cancel attendance
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', event?.id)
        .eq('user_id', user.id)
      
      if (!error) {
        setIsAttending(false)
        toast({
          title: "Attendance cancelled",
          description: "You're no longer attending this event.",
        })
      }
    } else {
      // Attend
      const { error } = await supabase
        .from('event_attendees')
        .insert([{
          event_id: event?.id,
          user_id: user.id,
          status: 'going'
        }])
      
      if (!error) {
        setIsAttending(true)
        toast({
          title: "You're attending!",
          description: "You've been added to the attendee list. Adding to your calendar...",
        })
        
        // Generate and download ICS file
        setTimeout(() => {
          generateICS()
        }, 500)
      }
    }
  }
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  if (!event) {
    return notFound()
  }
  
  const isUpcoming = new Date(event.event_start) > new Date()
  const isFull = event.max_attendees && event.attendee_count >= event.max_attendees
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 bg-gray-900">
        {event.featured_image_url ? (
          <img
            src={event.featured_image_url}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-8">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-4">
              <Badge 
                variant="outline" 
                className="border-white text-white"
                style={{ borderColor: event.category.color_hex }}
              >
                {event.category.name}
              </Badge>
              {event.is_featured && (
                <Badge variant="secondary" className="bg-yellow-500 text-black">
                  Featured Event
                </Badge>
              )}
              {!isUpcoming && (
                <Badge variant="secondary" className="bg-gray-500 text-white">
                  Past Event
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
            <p className="text-xl opacity-90 max-w-3xl">{event.short_description}</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{formatEventDate(event.event_start, event.event_end, event.all_day)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {event.venue ? (
                  <Link href={`/venues/${event.venue.slug || event.venue.id}`} className="hover:text-blue-600 hover:underline">
                    {event.venue.name}
                  </Link>
                ) : (
                  <span>{event.location_name || `${event.location_city}, ${event.location_state}`}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                variant={isLiked ? "primary" : "outline"} 
                size="icon"
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              {isUpcoming && (
                <>
                  {event.registration_url ? (
                    <Link href={event.registration_url} target="_blank">
                      <Button disabled={isFull}>
                        {isFull ? 'Event Full' : 'Register Now'}
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      disabled={isFull}
                      onClick={handleAttend}
                      variant={isAttending ? "secondary" : "default"}
                    >
                      {isFull ? 'Event Full' : isAttending ? 'Cancel Attendance' : 'Attend Event'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {event.long_description ? (
                    <div dangerouslySetInnerHTML={{ __html: event.long_description }} />
                  ) : (
                    <p>{event.short_description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Photos */}
            {event.photos && event.photos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {event.photos.map((photo) => (
                      <div key={photo.id} className="relative aspect-video rounded-lg overflow-hidden">
                        <Image
                          src={photo.photo_url}
                          alt={photo.caption || 'Event photo'}
                          fill
                          className="object-cover"
                        />
                        {photo.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Venue Info */}
            {event.venue && (
              <Card>
                <CardHeader>
                  <CardTitle>Venue Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Link href={`/venues/${event.venue.slug || event.venue.id}`}>
                        <h3 className="font-semibold text-lg hover:text-blue-600 cursor-pointer flex items-center gap-2">
                          {event.venue.name}
                          <ChevronRight className="h-4 w-4" />
                        </h3>
                      </Link>
                      {event.venue.description && (
                        <p className="text-gray-600 mt-1">{event.venue.description}</p>
                      )}
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p>{event.venue.address}</p>
                        <p>{event.venue.city}, {event.venue.state} {event.venue.zip_code}</p>
                      </div>
                    </div>
                    {event.venue.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-400" />
                        <span>Venue Capacity: {event.venue.capacity}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Associated Businesses */}
            {event.associated_businesses && event.associated_businesses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Partners & Sponsors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {event.associated_businesses.map((assoc) => (
                      <Link 
                        key={assoc.business.id}
                        href={`/directory/${assoc.business.slug}`}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={assoc.business.logo_url} />
                          <AvatarFallback>
                            {assoc.business.business_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium">{assoc.business.business_name}</h4>
                          <p className="text-sm text-gray-600">{assoc.association_type}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Event Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Date & Time</span>
                  </div>
                  <p className="font-medium">
                    {formatEventDate(event.event_start, event.event_end, event.all_day)}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Location</span>
                  </div>
                  {event.venue ? (
                    <>
                      <Link href={`/venues/${event.venue.slug || event.venue.id}`} className="font-medium hover:text-blue-600 hover:underline">
                        {event.venue.name}
                      </Link>
                      <p className="text-sm text-gray-600">
                        {event.venue.address && `${event.venue.address}, `}
                        {event.venue.city}, {event.venue.state} {event.venue.zip_code}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">{event.location_name}</p>
                      <p className="text-sm text-gray-600">
                        {event.location_address && `${event.location_address}, `}
                        {event.location_city}, {event.location_state} {event.location_zip}
                      </p>
                    </>
                  )}
                  {(event.latitude && event.longitude) || event.venue ? (
                    <Link 
                      href={`https://maps.google.com/?q=${
                        event.venue 
                          ? encodeURIComponent(`${event.venue.address} ${event.venue.city} ${event.venue.state} ${event.venue.zip_code}`)
                          : `${event.latitude},${event.longitude}`
                      }`}
                      target="_blank"
                      className="text-sm text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      Get Directions
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : null}
                </div>
                
                {event.virtual_meeting_url && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm font-medium">Virtual Event</span>
                    </div>
                    <Link 
                      href={event.virtual_meeting_url}
                      target="_blank"
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Join Online
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">Cost</span>
                  </div>
                  <p className="font-medium">
                    {event.cost === 0 ? 'Free' : event.cost_description || `$${event.cost}`}
                  </p>
                </div>
                
                {event.max_attendees && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Attendance</span>
                    </div>
                    <p className="font-medium">
                      {event.attendee_count} / {event.max_attendees} attending
                    </p>
                    {isFull && (
                      <Badge variant="secondary" className="mt-1">Event Full</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Organizer Card */}
            {event.organizer && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Organizer</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link 
                    href={`/directory/${event.organizer.slug}`}
                    className="block hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={event.organizer.logo_url} />
                        <AvatarFallback>
                          {event.organizer.business_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{event.organizer.business_name}</h3>
                          {event.organizer.verification_status === 'verified' && (
                            <Shield className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        {event.organizer.short_description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {event.organizer.short_description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                  
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {event.organizer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${event.organizer.phone}`} className="text-blue-600 hover:underline">
                          {event.organizer.phone}
                        </a>
                      </div>
                    )}
                    {event.organizer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${event.organizer.email}`} className="text-blue-600 hover:underline">
                          {event.organizer.email}
                        </a>
                      </div>
                    )}
                    {event.organizer.website_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <a 
                          href={event.organizer.website_url} 
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
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