import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft, Users, Heart, Calendar, Download, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/Input'

interface EventWithAttendees {
  id: string
  title: string
  event_start: string
  event_end: string
  all_day: boolean
  author_id: string
  attendee_count: number
  max_attendees: number
}

interface Attendee {
  id: string
  status: string
  rsvp_date: string
  notes: string | null
  user_id: string
  profile: {
    full_name: string | null
    avatar_url: string | null
    username: string | null
    email: string | null
  }
}

interface Like {
  id: string
  created_at: string
  user_id: string
  profile: {
    full_name: string | null
    avatar_url: string | null
    username: string | null
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default async function EventAttendeesPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  let user = null
  let event: EventWithAttendees | null = null
  let attendees: Attendee[] = []
  let likes: Like[] = []
  let likeCount = 0
  
  try {
    const resolvedParams = await params
    const { id: eventId } = resolvedParams
    
    const supabase = await createServerClient()
    
    // Check if user is authenticated
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authData?.user) {
      redirect('/login')
    }
    
    user = authData.user
    
    // Get event details
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, title, event_start, event_end, all_day, author_id, attendee_count, max_attendees')
      .eq('id', eventId)
      .single()
    
    if (eventError || !eventData) {
      redirect('/dashboard/events')
    }
    
    // Check if user is the event author
    if (eventData.author_id !== user.id) {
      redirect('/dashboard/events')
    }
    
    event = eventData
    
    // Get attendees with profile info
    const { data: attendeesData, error: attendeesError } = await supabase
      .from('event_attendees_with_profile')
      .select('*')
      .eq('event_id', eventId)
      .order('rsvp_date', { ascending: false })
    
    if (!attendeesError && attendeesData) {
      attendees = attendeesData.map(a => ({
        ...a,
        profile: {
          full_name: a.full_name,
          avatar_url: a.avatar_url,
          username: a.username,
          email: null // Email is in profiles table but not exposed in the view for privacy
        }
      }))
    }
    
    // Get likes with profile info
    const { data: likesData, error: likesError } = await supabase
      .from('event_likes_with_profile')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    
    if (!likesError && likesData) {
      likes = likesData.map(l => ({
        ...l,
        profile: {
          full_name: l.full_name,
          avatar_url: l.avatar_url,
          username: l.username
        }
      }))
    }
    
    // Get like count
    const { count } = await supabase
      .from('event_likes')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
    
    likeCount = count || 0
    
  } catch (error) {
    console.error('Error loading attendees:', error)
    redirect('/dashboard/events')
  }

  const goingAttendees = attendees.filter(a => a.status === 'going')
  const interestedAttendees = attendees.filter(a => a.status === 'interested')
  const notGoingAttendees = attendees.filter(a => a.status === 'not_going')

  // Function to export attendees as CSV
  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Username', 'Status', 'RSVP Date', 'Notes']
    const rows = attendees.map(a => [
      a.profile.full_name || 'N/A',
      a.profile.email || 'N/A',
      a.profile.username || 'N/A',
      a.status,
      formatDate(a.rsvp_date),
      a.notes || ''
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    return `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/events" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Events
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event?.title}</h1>
              <p className="text-gray-600 mt-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                {formatDate(event?.event_start || '')}
              </p>
            </div>
            <a href={exportCSV()} download={`${event?.title}-attendees.csv`}>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Attending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {goingAttendees.length}
                {event?.max_attendees && (
                  <span className="text-sm font-normal text-gray-500"> / {event.max_attendees}</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Interested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interestedAttendees.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Not Going</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notGoingAttendees.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Likes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{likeCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="attendees" className="space-y-6">
          <TabsList>
            <TabsTrigger value="attendees">
              <Users className="h-4 w-4 mr-2" />
              Attendees ({attendees.length})
            </TabsTrigger>
            <TabsTrigger value="likes">
              <Heart className="h-4 w-4 mr-2" />
              Likes ({likes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendees">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Event Attendees</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search attendees..."
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="going" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="going">Going ({goingAttendees.length})</TabsTrigger>
                    <TabsTrigger value="interested">Interested ({interestedAttendees.length})</TabsTrigger>
                    <TabsTrigger value="not_going">Not Going ({notGoingAttendees.length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="going">
                    <AttendeeList attendees={goingAttendees} />
                  </TabsContent>
                  
                  <TabsContent value="interested">
                    <AttendeeList attendees={interestedAttendees} />
                  </TabsContent>
                  
                  <TabsContent value="not_going">
                    <AttendeeList attendees={notGoingAttendees} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="likes">
            <Card>
              <CardHeader>
                <CardTitle>People Who Liked This Event</CardTitle>
              </CardHeader>
              <CardContent>
                {likes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No likes yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {likes.map((like) => (
                      <div key={like.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar>
                          <AvatarImage src={like.profile.avatar_url || undefined} />
                          <AvatarFallback>
                            {(like.profile.full_name || like.profile.username || '?').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {like.profile.full_name || like.profile.username || 'Anonymous'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Liked {new Date(like.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function AttendeeList({ attendees }: { attendees: Attendee[] }) {
  if (attendees.length === 0) {
    return <p className="text-gray-500 text-center py-8">No attendees in this category</p>
  }

  return (
    <div className="space-y-3">
      {attendees.map((attendee) => (
        <div key={attendee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={attendee.profile.avatar_url || undefined} />
              <AvatarFallback>
                {(attendee.profile.full_name || attendee.profile.username || '?').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {attendee.profile.full_name || attendee.profile.username || 'Anonymous'}
              </p>
              {attendee.profile.email && (
                <p className="text-sm text-gray-600">{attendee.profile.email}</p>
              )}
              {attendee.notes && (
                <p className="text-sm text-gray-500 mt-1">{attendee.notes}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <Badge variant={
              attendee.status === 'going' ? 'default' : 
              attendee.status === 'interested' ? 'secondary' : 
              'outline'
            }>
              {attendee.status === 'going' ? 'Going' :
               attendee.status === 'interested' ? 'Interested' :
               'Not Going'}
            </Badge>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(attendee.rsvp_date)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}