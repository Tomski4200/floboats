'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, Search, Edit, Trash2, Eye, MoreHorizontal, Heart, Users, MapPin } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth-context'
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
  max_attendees: number
  attendee_count: number
  featured_image_url: string
  is_featured: boolean
  event_visibility: string
  status: string
  approval_status: string
  created_at: string
  category: {
    name: string
    color_hex: string
  }
  organizer: {
    business_name: string
    slug: string
  } | null
  like_count?: number
}

function formatEventDate(start: string, end: string | null, allDay: boolean) {
  const startDate = new Date(start)
  
  const dateOptions: Intl.DateTimeFormatOptions = { 
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
  
  return `${startDate.toLocaleDateString('en-US', dateOptions)} at ${startDate.toLocaleTimeString('en-US', timeOptions)}`
}

export default function EventsDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<EventListing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('upcoming')
  
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createBrowserClient()
      
      let query = supabase
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
          max_attendees,
          attendee_count,
          featured_image_url,
          is_featured,
          event_visibility,
          status,
          approval_status,
          created_at,
          category:event_categories(
            name,
            color_hex
          ),
          organizer:businesses!organizer_business_id(
            business_name,
            slug
          )
        `)
        .eq('author_id', user?.id)
        .order('event_start', { ascending: true })
      
      // Apply tab filter
      const now = new Date().toISOString()
      if (activeTab === 'upcoming') {
        query = query.gte('event_start', now)
      } else if (activeTab === 'past') {
        query = query.lt('event_start', now)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching events:', error)
      } else {
        // Get like counts for each event
        const eventsWithLikes = await Promise.all((data || []).map(async (event) => {
          const { count } = await supabase
            .from('event_likes')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
          
          return {
            ...event,
            category: Array.isArray(event.category) ? event.category[0] : event.category,
            organizer: Array.isArray(event.organizer) ? event.organizer[0] : event.organizer,
            like_count: count || 0
          }
        }))
        
        setEvents(eventsWithLikes as EventListing[])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, activeTab])
  
  useEffect(() => {
    if (!user) {
      router.push('/auth/sign-in?redirect=/dashboard/events')
      return
    }
    
    fetchEvents()
  }, [user, fetchEvents, router])
  
  async function deleteEvent(id: string) {
    if (!confirm('Are you sure you want to delete this event?')) return
    
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting event:', error)
        alert('Failed to delete event')
      } else {
        fetchEvents()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete event')
    }
  }
  
  const filteredEvents = events.filter(event => {
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (statusFilter !== 'all' && event.status !== statusFilter) {
      return false
    }
    return true
  })
  
  const getStatusBadge = (status: string, approvalStatus: string) => {
    if (status === 'draft') {
      return <Badge variant="secondary">Draft</Badge>
    }
    if (status === 'published') {
      if (approvalStatus === 'pending') {
        return <Badge variant="outline" className="border-yellow-600 text-yellow-600">Pending Approval</Badge>
      }
      if (approvalStatus === 'approved') {
        return <Badge variant="outline" className="border-green-600 text-green-600">Published</Badge>
      }
      if (approvalStatus === 'rejected') {
        return <Badge variant="outline" className="border-red-600 text-red-600">Rejected</Badge>
      }
    }
    if (status === 'cancelled') {
      return <Badge variant="outline" className="border-gray-600 text-gray-600">Cancelled</Badge>
    }
    return null
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
              <p className="mt-1 text-gray-600">Manage your events and track attendance</p>
            </div>
            <Link href="/dashboard/events/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter(e => new Date(e.event_start) > new Date()).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Attendees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.reduce((sum, e) => sum + e.attendee_count, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Likes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.reduce((sum, e) => sum + (e.like_count || 0), 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Featured Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter(e => e.is_featured).length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Events List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="all">All Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'Try adjusting your search filters' : 'Create your first event to get started'}
                  </p>
                  {!searchQuery && (
                    <Link href="/dashboard/events/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => {
                  return (
                    <Card key={event.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {event.featured_image_url && (
                            <div className="hidden md:block">
                              <Image
                                src={event.featured_image_url}
                                alt={event.title}
                                width={128}
                                height={96}
                                className="w-32 h-24 object-cover rounded-lg"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold">{event.title}</h3>
                                  {getStatusBadge(event.status, event.approval_status)}
                                  {event.is_featured && (
                                    <Badge variant="secondary" className="bg-yellow-100">Featured</Badge>
                                  )}
                                </div>
                                <p className="text-gray-600 mb-3 line-clamp-2">{event.short_description}</p>
                                
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatEventDate(event.event_start, event.event_end, event.all_day)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{event.location_city}, {event.location_state}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>
                                      {event.attendee_count}
                                      {event.max_attendees && ` / ${event.max_attendees}`} attending
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Heart className="h-4 w-4" />
                                    <span>{event.like_count || 0} likes</span>
                                  </div>
                                  <Badge 
                                    variant="outline"
                                    style={{ borderColor: event.category.color_hex, color: event.category.color_hex }}
                                  >
                                    {event.category.name}
                                  </Badge>
                                </div>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/events/${event.slug || event.id}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Event
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/events/${event.id}/attendees`}>
                                      <Users className="h-4 w-4 mr-2" />
                                      View Attendees
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/events/${event.id}/edit`}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Event
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => deleteEvent(event.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Event
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
