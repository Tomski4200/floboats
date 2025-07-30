import { Suspense } from 'react'
import Link from 'next/link'
import { MapPin, Phone, Globe, Star, Clock } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/Button'
import BusinessFilters from '@/components/BusinessFilters'
import BusinessSearch from '@/components/BusinessSearch'
import BusinessOwnerCta from '@/components/BusinessOwnerCta'

interface BusinessWithDetails {
  id: string
  business_name: string
  slug: string
  description: string
  short_description: string
  phone: string
  email: string
  website_url: string
  address_line1: string
  city: string
  state: string
  average_rating: number
  review_count: number
  is_premium: boolean
  verification_status: string
  business_hours: any
  categories: {
    id: string
    name: string
    icon: string
    color_hex: string
  }[]
  photos: {
    photo_url: string
    caption: string
    photo_type: string
  }[]
}

function BusinessCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Skeleton className="h-24 w-24 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface BusinessListProps {
  searchParams: {
    category?: string
    search?: string
    city?: string
    sort?: string
    location?: string
    radius?: string
  }
}

async function BusinessList({ searchParams }: BusinessListProps) {
  const supabase = await createServerClient()
  
  let query = supabase
    .from('businesses')
    .select(`
      *,
      categories:business_categories(
        id,
        name,
        icon,
        color_hex
      ),
      photos:business_photos(
        photo_url,
        caption,
        photo_type
      )
    `)
    .eq('business_status', 'active')
    .eq('listing_status', 'published')
  
  // Apply filters
  if (searchParams.category) {
    query = query.in('categories.id', [searchParams.category])
  }
  
  if (searchParams.search) {
    query = query.or(`business_name.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
  }
  
  if (searchParams.city) {
    query = query.ilike('city', `%${searchParams.city}%`)
  }

  if (searchParams.location && searchParams.radius) {
    const geocodeResponse = await fetch(`/api/geocode?location=${encodeURIComponent(searchParams.location)}`)
    if (geocodeResponse.ok) {
      const { latitude, longitude } = await geocodeResponse.json()
      const { data: nearbyBusinessIds, error: rpcError } = await supabase.rpc('nearby_businesses', {
        lat: latitude,
        long: longitude,
        radius: parseInt(searchParams.radius)
      })

      if (rpcError) {
        console.error('Error fetching nearby businesses:', rpcError)
      } else if (nearbyBusinessIds && nearbyBusinessIds.length > 0) {
        query = query.in('id', nearbyBusinessIds.map((b: any) => b.id))
      } else {
        // If no businesses are found in the radius, we should return no results.
        // We can do this by adding a filter that will never be true.
        query = query.eq('id', '00000000-0000-0000-0000-000000000000')
      }
    }
  }
  
  // Apply sorting
  switch (searchParams.sort) {
    case 'rating':
      query = query.order('average_rating', { ascending: false })
      break
    case 'reviews':
      query = query.order('review_count', { ascending: false })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    default:
      query = query.order('is_premium', { ascending: false })
        .order('average_rating', { ascending: false })
  }
  
  const { data: businesses, error } = await query
  
  if (error) {
    console.error('Error fetching businesses:', error)
    return <div>Error loading businesses</div>
  }
  
  if (!businesses || businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No businesses found. Try adjusting your filters.</p>
      </div>
    )
  }
  
  return (
    <div className="grid gap-6">
      {(businesses as BusinessWithDetails[]).map((business) => {
        const primaryPhoto = business.photos?.find(p => p.photo_type === 'logo' || p.photo_type === 'exterior') || business.photos?.[0]
        const isOpen = checkIfOpen(business.business_hours)
        
        return (
          <Card key={business.id} className={business.is_premium ? 'border-yellow-500' : ''}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                {primaryPhoto && (
                  <img
                    src={primaryPhoto.photo_url}
                    alt={business.business_name}
                    className="h-24 w-24 object-cover rounded-lg"
                  />
                )}
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link 
                        href={`/directory/${business.slug}`}
                        className="hover:underline"
                      >
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                          {business.business_name}
                          {business.is_premium && (
                            <Badge variant="secondary" className="bg-yellow-100">
                              Premium
                            </Badge>
                          )}
                          {business.verification_status === 'verified' && (
                            <Badge variant="secondary" className="bg-green-100">
                              Verified
                            </Badge>
                          )}
                        </h3>
                      </Link>
                      
                      {business.categories && business.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {business.categories.map(category => (
                            <Badge 
                              key={category.id}
                              variant="outline"
                              style={{ borderColor: category.color_hex, color: category.color_hex }}
                            >
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {business.average_rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{business.average_rating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">
                            ({business.review_count})
                          </span>
                        </div>
                      )}
                      
                      <Badge 
                        variant={isOpen ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {isOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mt-2 line-clamp-2">
                    {business.short_description || business.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {business.city}, {business.state}
                    </div>
                    
                    {business.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {business.phone}
                      </div>
                    )}
                    
                    {business.website_url && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <a 
                          href={business.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
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

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    search?: string
    city?: string
    sort?: string
    location?: string
    radius?: string
  }>
}) {
  const params = await searchParams
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Business Directory</h1>
        <p className="text-muted-foreground">
          Find marinas, dealers, service providers, and more in Florida's boating community
        </p>
      </div>

      <BusinessOwnerCta />
      
      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <BusinessFilters />
          </Suspense>
        </aside>
        
        <main className="lg:col-span-3">
          <div className="mb-6">
            <BusinessSearch />
          </div>
          
          <Suspense 
            fallback={
              <div className="grid gap-6">
                <BusinessCardSkeleton />
                <BusinessCardSkeleton />
                <BusinessCardSkeleton />
              </div>
            }
          >
            <BusinessList searchParams={params} />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
