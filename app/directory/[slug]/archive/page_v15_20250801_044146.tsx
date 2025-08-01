import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  MapPin, Phone, Globe, Clock, Star, Shield, 
  ChevronLeft, ExternalLink, Navigation, Mail
} from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import BusinessReviews from '@/components/BusinessReviews'
import BusinessGallery from '@/components/BusinessGallery'

interface BusinessDetails {
  id: string
  business_name: string
  slug: string
  description: string
  short_description: string
  phone: string
  email: string
  website_url: string
  business_hours: any
  address_line1: string
  address_line2?: string
  city: string
  state: string
  zip_code: string
  coordinates: { x: number; y: number } | null
  specialties: string[]
  services_offered: string[]
  amenities: any
  social_media: any
  verification_status: string
  business_status: string
  is_premium: boolean
  average_rating: number
  review_count: number
  established_year: number
  employee_count_range: string
  license_number: string
  business_to_category_links: {
    category: {
      id: string
      name: string
      icon: string
      color_hex: string
      parent_category_id: string | null
    }
  }[]
  photos: {
    id: string
    photo_url: string
    caption: string
    photo_type: string
    is_primary: boolean
    order_index: number
  }[]
  marina_details?: {
    slip_count: number
    max_vessel_length: number
    max_vessel_draft: number
    fuel_types: string[]
    has_fuel_dock: boolean
    has_pump_out: boolean
    has_haul_out: boolean
    has_boat_ramp: boolean
    has_dry_storage: boolean
    amenities: any
  }
}

function formatBusinessHours(hours: any): { day: string; hours: string }[] {
  if (!hours) return []
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  return days.map((day, index) => {
    const dayHours = hours[day]
    if (!dayHours) return { day: dayNames[index], hours: 'Closed' }
    if (dayHours.closed) return { day: dayNames[index], hours: 'Closed' }
    
    const formatTime = (time: string) => {
      const [hour, minute] = time.split(':')
      const h = parseInt(hour)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
      return `${displayHour}:${minute} ${ampm}`
    }
    
    return {
      day: dayNames[index],
      hours: `${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`
    }
  })
}

function checkIfOpen(businessHours: any): boolean {
  if (!businessHours) return false
  
  const now = new Date()
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const currentDay = days[now.getDay()]
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  
  const todayHours = businessHours[currentDay]
  if (!todayHours || todayHours.closed) return false
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close
}

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerClient()
  
  console.log('Fetching business with slug:', slug)
  
  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      *,
      business_to_category_links(
        category:business_categories(
          id,
          name,
          icon,
          color_hex,
          parent_category_id
        )
      ),
      photos:business_photos(
        id,
        photo_url,
        caption,
        photo_type,
        is_primary,
        order_index
      ),
      marina_details:marina_details(*)
    `)
    .eq('slug', slug)
    .single()
  
  if (error) {
    console.error('Error fetching business:', error)
    notFound()
  }
  
  if (!business) {
    console.log('No business found with slug:', slug)
    notFound()
  }
  
  console.log('Business data fetched:', JSON.stringify(business, null, 2))
  
  const businessData = business as BusinessDetails
  const isOpen = checkIfOpen(businessData.business_hours)
  const hours = formatBusinessHours(businessData.business_hours)
  const primaryPhoto = businessData.photos?.find(p => p.is_primary) || businessData.photos?.[0]
  const primaryCategory = businessData.business_to_category_links?.[0]?.category
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Link 
        href="/directory"
        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Directory
      </Link>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  {businessData.business_name}
                  {businessData.verification_status === 'verified' && (
                    <Shield className="h-6 w-6 text-green-600" />
                  )}
                </h1>
                
                <div className="flex items-center gap-3 mt-2">
                  {primaryCategory && (
                    <Badge 
                      variant="outline"
                      style={{ borderColor: primaryCategory.color_hex, color: primaryCategory.color_hex }}
                    >
                      {primaryCategory.name}
                    </Badge>
                  )}
                  
                  {businessData.is_premium && (
                    <Badge variant="secondary" className="bg-yellow-100">
                      Premium Listing
                    </Badge>
                  )}
                  
                  <Badge variant={isOpen ? 'default' : 'secondary'}>
                    <Clock className="h-3 w-3 mr-1" />
                    {isOpen ? 'Open Now' : 'Closed'}
                  </Badge>
                </div>
                
                {businessData.average_rating > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(businessData.average_rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">{businessData.average_rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({businessData.review_count} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Gallery */}
          {businessData.photos && businessData.photos.length > 0 && (
            <BusinessGallery photos={businessData.photos} businessName={businessData.business_name} />
          )}
          
          {/* Tabs */}
          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({businessData.review_count || 0})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {businessData.description}
                  </p>
                  
                  {businessData.established_year && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Established in {businessData.established_year}
                    </p>
                  )}
                </CardContent>
              </Card>
              
              {businessData.specialties && businessData.specialties.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Specialties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {businessData.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {businessData.marina_details && (
                <Card>
                  <CardHeader>
                    <CardTitle>Marina Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Slips</p>
                        <p className="font-semibold">{businessData.marina_details.slip_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Max Vessel Length</p>
                        <p className="font-semibold">{businessData.marina_details.max_vessel_length} ft</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Max Draft</p>
                        <p className="font-semibold">{businessData.marina_details.max_vessel_draft} ft</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fuel Types</p>
                        <p className="font-semibold">{businessData.marina_details.fuel_types.join(', ')}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-sm font-semibold mb-2">Marina Services</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {businessData.marina_details.has_fuel_dock && <p>✓ Fuel Dock</p>}
                        {businessData.marina_details.has_pump_out && <p>✓ Pump Out</p>}
                        {businessData.marina_details.has_haul_out && <p>✓ Haul Out</p>}
                        {businessData.marina_details.has_boat_ramp && <p>✓ Boat Ramp</p>}
                        {businessData.marina_details.has_dry_storage && <p>✓ Dry Storage</p>}
                      </div>
                    </div>
                    
                    {businessData.marina_details.amenities && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-semibold mb-2">Amenities</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(businessData.marina_details.amenities).map(([key, value]) => 
                              value === true && (
                                <p key={key}>✓ {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                              )
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="services" className="space-y-6">
              {businessData.services_offered && businessData.services_offered.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Services Offered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {businessData.services_offered.map((service) => (
                        <div key={service} className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-primary rounded-full" />
                          <span>{service}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {businessData.amenities && Object.keys(businessData.amenities).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities & Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(businessData.amenities).map(([key, value]) => 
                        value === true && (
                          <div key={key} className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-primary rounded-full" />
                            <span>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="reviews">
              <BusinessReviews businessId={businessData.id} />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p>{businessData.address_line1}</p>
                  {businessData.address_line2 && <p>{businessData.address_line2}</p>}
                  <p>{businessData.city}, {businessData.state} {businessData.zip_code}</p>
                </div>
              </div>
              
              {businessData.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <a href={`tel:${businessData.phone}`} className="hover:underline">
                    {businessData.phone}
                  </a>
                </div>
              )}
              
              {businessData.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <a href={`mailto:${businessData.email}`} className="hover:underline">
                    {businessData.email}
                  </a>
                </div>
              )}
              
              {businessData.website_url && (
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <a 
                    href={businessData.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              
              {businessData.coordinates && (
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${businessData.coordinates.y},${businessData.coordinates.x}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-row items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-500 h-10 px-4 w-full"
                >
                  <Navigation className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Get Directions</span>
                </a>
              )}
            </CardContent>
          </Card>
          
          {/* Hours Card */}
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hours.map(({ day, hours }) => {
                  const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day
                  
                  return (
                    <div 
                      key={day} 
                      className={`flex justify-between text-sm ${isToday ? 'font-semibold' : ''}`}
                    >
                      <span>{day}</span>
                      <span className={hours === 'Closed' ? 'text-muted-foreground' : ''}>
                        {hours}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Social Media */}
          {businessData.social_media && Object.keys(businessData.social_media).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Connect</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {businessData.social_media.facebook && (
                    <a 
                      href={businessData.social_media.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-500 h-10 w-10"
                    >
                      F
                    </a>
                  )}
                  {businessData.social_media.instagram && (
                    <a 
                      href={businessData.social_media.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-500 h-10 w-10"
                    >
                      I
                    </a>
                  )}
                  {businessData.social_media.twitter && (
                    <a 
                      href={businessData.social_media.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-500 h-10 w-10"
                    >
                      X
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}