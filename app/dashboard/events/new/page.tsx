'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, Plus } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth-context'
import ImageUpload from '@/components/ImageUpload'

interface EventCategory {
  id: string
  name: string
  color_hex: string
}

interface Business {
  id: string
  business_name: string
}

interface EventVenue {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
}

export default function CreateEventPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [userBusinesses, setUserBusinesses] = useState<Business[]>([])
  const [venues, setVenues] = useState<EventVenue[]>([])
  const [showVenueDialog, setShowVenueDialog] = useState(false)
  const [newVenue, setNewVenue] = useState({
    name: '',
    address: '',
    city: '',
    state: 'FL',
    zip_code: ''
  })
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    long_description: '',
    category_id: '',
    organizer_business_id: '',
    event_start_date: '',
    event_start_time: '',
    event_end_date: '',
    event_end_time: '',
    all_day: false,
    location_name: '',
    location_address: '',
    location_city: '',
    location_state: 'FL',
    location_zip: '',
    venue_id: '',
    virtual_meeting_url: '',
    cost: 0,
    cost_description: '',
    max_attendees: '',
    registration_url: '',
    featured_image_url: '',
    event_visibility: 'public',
    status: 'draft',
    is_featured: false,
  })
  
  useEffect(() => {
    if (!user) {
      router.push('/auth/sign-in?redirect=/dashboard/events/new')
      return
    }
    
    fetchInitialData()
  }, [user])
  
  async function fetchInitialData() {
    try {
      const supabase = createBrowserClient()
      console.log('fetchInitialData called, user:', user)
      
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('event_categories')
        .select('id, name, color_hex')
        .order('order_index')
      
      setCategories(categoriesData || [])
      console.log('Categories fetched:', categoriesData?.length || 0)
      
      // Fetch user's businesses
      // First, let's try to get all businesses to debug
      const { data: allBusinesses, error: allBusinessesError } = await supabase
        .from('businesses')
        .select('*')
        .limit(5)
      
      console.log('Sample businesses:', allBusinesses)
      
      // Fetch businesses through user_business_permissions table
      const { data: businessPermissions, error: permissionsError } = await supabase
        .from('user_business_permissions')
        .select(`
          business_id,
          businesses (
            id,
            business_name
          )
        `)
        .eq('user_id', user?.id)
        .in('role', ['owner', 'manager'])
      
      if (permissionsError) {
        console.error('Error fetching business permissions:', permissionsError)
      }
      
      // Extract businesses from the permissions
      const businessesData = businessPermissions?.map(perm => perm.businesses).filter(Boolean) || []
      
      setUserBusinesses(businessesData)
      console.log('User businesses fetched:', businessesData.length, 'for user:', user?.id)
      
      // Fetch venues
      const { data: venuesData, error: venuesError } = await supabase
        .from('event_venues')
        .select('id, name, address, city, state, zip_code')
        .order('name')
      
      if (venuesError) {
        console.error('Error fetching venues:', venuesError)
      }
      setVenues(venuesData || [])
      console.log('Venues fetched:', venuesData?.length || 0)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }
  
  async function handleSubmit(e: React.FormEvent, saveAsDraft = false) {
    e.preventDefault()
    
    if (!user) return
    
    try {
      setLoading(true)
      const supabase = createBrowserClient()
      
      // Combine date and time
      let eventStart = formData.event_start_date
      let eventEnd = formData.event_end_date || formData.event_start_date
      
      if (!formData.all_day) {
        eventStart = `${formData.event_start_date}T${formData.event_start_time}:00`
        eventEnd = formData.event_end_date && formData.event_end_time
          ? `${formData.event_end_date}T${formData.event_end_time}:00`
          : `${formData.event_start_date}T${formData.event_end_time || formData.event_start_time}:00`
      }
      
      const eventData = {
        title: formData.title,
        short_description: formData.short_description,
        long_description: formData.long_description,
        category_id: formData.category_id,
        organizer_business_id: formData.organizer_business_id === 'none' ? null : formData.organizer_business_id || null,
        author_id: user.id,
        event_start: eventStart,
        event_end: eventEnd,
        all_day: formData.all_day,
        location_name: formData.location_name,
        location_address: formData.location_address,
        location_city: formData.location_city,
        location_state: formData.location_state,
        location_zip: formData.location_zip,
        venue_id: formData.venue_id === 'custom' ? null : formData.venue_id || null,
        virtual_meeting_url: formData.virtual_meeting_url,
        cost: formData.cost,
        cost_description: formData.cost_description,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        registration_url: formData.registration_url,
        featured_image_url: formData.featured_image_url,
        event_visibility: formData.event_visibility,
        status: saveAsDraft ? 'draft' : 'published',
        approval_status: saveAsDraft ? 'pending' : 'pending',
        is_featured: formData.is_featured,
      }
      
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single()
      
      if (error) {
        console.error('Error creating event:', error)
        alert('Failed to create event. Please try again.')
      } else {
        router.push('/dashboard/events')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  function handleVenueSelect(venueId: string) {
    if (venueId === 'custom') {
      setFormData({
        ...formData,
        venue_id: venueId,
      })
    } else {
      const venue = venues.find(v => v.id === venueId)
      if (venue) {
        setFormData({
          ...formData,
          venue_id: venueId,
          location_name: venue.name,
          location_address: venue.address,
          location_city: venue.city,
          location_state: venue.state,
          location_zip: venue.zip_code,
        })
      }
    }
  }
  
  async function handleCreateVenue() {
    if (!user) return
    
    try {
      const supabase = createBrowserClient()
      
      const { data, error } = await supabase
        .from('event_venues')
        .insert([{
          name: newVenue.name,
          address: newVenue.address,
          city: newVenue.city,
          state: newVenue.state,
          zip_code: newVenue.zip_code,
          created_by: user.id
        }])
        .select()
        .single()
      
      if (error) {
        console.error('Error creating venue:', error)
        alert('Failed to create venue. Please try again.')
      } else {
        // Add new venue to list and select it
        setVenues([...venues, data])
        setFormData({
          ...formData,
          venue_id: data.id,
          location_name: data.name,
          location_address: data.address,
          location_city: data.city,
          location_state: data.state,
          location_zip: data.zip_code,
        })
        setShowVenueDialog(false)
        setNewVenue({ name: '', address: '', city: '', state: 'FL', zip_code: '' })
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/events">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
                <p className="text-gray-600">Fill in the details to create your event</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading}
              >
                <Eye className="h-4 w-4 mr-2" />
                Publish Event
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  The main details about your event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter event title"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="short_description">Short Description *</Label>
                  <Textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Brief description for event listings (max 200 characters)"
                    rows={3}
                    maxLength={200}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.short_description.length}/200 characters
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="long_description">Full Description</Label>
                  <Textarea
                    id="long_description"
                    value={formData.long_description}
                    onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                    placeholder="Detailed description of your event"
                    rows={8}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="organizer">Organizing Business</Label>
                    <Select 
                      value={formData.organizer_business_id} 
                      onValueChange={(value) => setFormData({ ...formData, organizer_business_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a business (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Personal Event</SelectItem>
                        {userBusinesses.map((business) => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.business_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Date & Time */}
            <Card>
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
                <CardDescription>
                  When is your event happening?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all_day"
                    checked={formData.all_day}
                    onCheckedChange={(checked) => setFormData({ ...formData, all_day: checked as boolean })}
                  />
                  <Label htmlFor="all_day">All-day event</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.event_start_date}
                      onChange={(e) => setFormData({ ...formData, event_start_date: e.target.value })}
                      required
                    />
                  </div>
                  
                  {!formData.all_day && (
                    <div>
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.event_start_time}
                        onChange={(e) => setFormData({ ...formData, event_start_time: e.target.value })}
                        required={!formData.all_day}
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.event_end_date}
                      onChange={(e) => setFormData({ ...formData, event_end_date: e.target.value })}
                      min={formData.event_start_date}
                    />
                  </div>
                  
                  {!formData.all_day && (
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.event_end_time}
                        onChange={(e) => setFormData({ ...formData, event_end_time: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>
                  Where is your event taking place?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="venue">Select Venue</Label>
                  <Select 
                    value={formData.venue_id} 
                    onValueChange={handleVenueSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose from existing venues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Location</SelectItem>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name} - {venue.city}, {venue.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Dialog open={showVenueDialog} onOpenChange={setShowVenueDialog}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Venue
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white">
                      <DialogHeader>
                        <DialogTitle>Add New Venue</DialogTitle>
                        <DialogDescription>
                          Create a new venue that can be reused for future events.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="venue-name">Venue Name *</Label>
                          <Input
                            id="venue-name"
                            value={newVenue.name}
                            onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                            placeholder="e.g., Miami Convention Center"
                          />
                        </div>
                        <div>
                          <Label htmlFor="venue-address">Street Address</Label>
                          <Input
                            id="venue-address"
                            value={newVenue.address}
                            onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })}
                            placeholder="123 Main Street"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="venue-city">City *</Label>
                            <Input
                              id="venue-city"
                              value={newVenue.city}
                              onChange={(e) => setNewVenue({ ...newVenue, city: e.target.value })}
                              placeholder="Miami"
                            />
                          </div>
                          <div>
                            <Label htmlFor="venue-state">State *</Label>
                            <Select 
                              value={newVenue.state} 
                              onValueChange={(value) => setNewVenue({ ...newVenue, state: value })}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FL">Florida</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="venue-zip">ZIP Code</Label>
                          <Input
                            id="venue-zip"
                            value={newVenue.zip_code}
                            onChange={(e) => setNewVenue({ ...newVenue, zip_code: e.target.value })}
                            placeholder="33139"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowVenueDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateVenue}
                          disabled={!newVenue.name || !newVenue.city}
                        >
                          Create Venue
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="border-t pt-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="location_name">Location Name *</Label>
                      <Input
                        id="location_name"
                        value={formData.location_name}
                        onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                        placeholder="e.g., Miami Beach Convention Center"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location_address">Street Address</Label>
                      <Input
                        id="location_address"
                        value={formData.location_address}
                        onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                        placeholder="123 Main Street"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="location_city">City *</Label>
                        <Input
                          id="location_city"
                          value={formData.location_city}
                          onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                          placeholder="Miami"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="location_state">State *</Label>
                        <Select 
                          value={formData.location_state} 
                          onValueChange={(value) => setFormData({ ...formData, location_state: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FL">Florida</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="location_zip">ZIP Code</Label>
                        <Input
                          id="location_zip"
                          value={formData.location_zip}
                          onChange={(e) => setFormData({ ...formData, location_zip: e.target.value })}
                          placeholder="33139"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="virtual_url">Virtual Meeting URL</Label>
                  <Input
                    id="virtual_url"
                    type="url"
                    value={formData.virtual_meeting_url}
                    onChange={(e) => setFormData({ ...formData, virtual_meeting_url: e.target.value })}
                    placeholder="https://zoom.us/j/123456789"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Add a virtual meeting link for hybrid or online events
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing & Registration */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cost">Event Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cost_description">Cost Description</Label>
                  <Input
                    id="cost_description"
                    value={formData.cost_description}
                    onChange={(e) => setFormData({ ...formData, cost_description: e.target.value })}
                    placeholder="e.g., $25 adults, $10 children"
                  />
                </div>
                
                <div>
                  <Label htmlFor="max_attendees">Maximum Attendees</Label>
                  <Input
                    id="max_attendees"
                    type="number"
                    min="1"
                    value={formData.max_attendees}
                    onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                    placeholder="Leave blank for unlimited"
                  />
                </div>
                
                <div>
                  <Label htmlFor="registration_url">Registration URL</Label>
                  <Input
                    id="registration_url"
                    type="url"
                    value={formData.registration_url}
                    onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
                    placeholder="https://eventbrite.com/..."
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Media */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload Image</TabsTrigger>
                    <TabsTrigger value="url">Image URL</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-4">
                    <ImageUpload
                      value={formData.featured_image_url}
                      onChange={(url) => setFormData({ ...formData, featured_image_url: url })}
                      bucket="event-photos"
                      maxSizeMB={2}
                    />
                  </TabsContent>
                  <TabsContent value="url" className="mt-4 space-y-2">
                    <Label htmlFor="featured_image_url">Image URL</Label>
                    <Input
                      id="featured_image_url"
                      type="url"
                      value={formData.featured_image_url}
                      onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-sm text-gray-500">
                      Enter the URL of your event's featured image
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Event Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Event Visibility</Label>
                  <RadioGroup 
                    value={formData.event_visibility} 
                    onValueChange={(value) => setFormData({ ...formData, event_visibility: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public" className="font-normal">
                        Public - Anyone can view this event
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private" className="font-normal">
                        Private - Only invited attendees can view
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked as boolean })}
                  />
                  <Label htmlFor="featured">Feature this event</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}