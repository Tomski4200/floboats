import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { formatLocation } from '@/lib/format-utils'
import BusinessOwnerCta from '@/components/BusinessOwnerCta'

interface BoatPhoto {
  photo_url: string
  is_primary: boolean
}

interface BoatProfile {
  username: string
  location: string
}

interface Boat {
  id: string
  title?: string
  year?: number
  make: string
  model: string
  price?: number
  boat_type?: string
  condition?: string
  length_inches?: number
  length_feet?: number
  location?: string
  boat_photos?: BoatPhoto[]
  profiles?: BoatProfile
}

interface BusinessCategory {
  id: string
  name: string
  icon: string
  color_hex: string
}

interface BusinessPhoto {
  photo_url: string
  photo_type: string
}

interface Business {
  id: string
  business_name: string
  slug: string
  short_description?: string
  is_premium?: boolean
  average_rating?: number
  review_count?: number
  categories: BusinessCategory[]
  photos?: BusinessPhoto[]
}

export default async function HomePage() {
  const supabase = await createServerClient()

  // Get featured boats or recent listings
  const { data: featuredBoats } = await supabase
    .from('boats')
    .select(`
      *,
      boat_photos (
        photo_url,
        is_primary
      ),
      profiles (
        username,
        location
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(12)

  // Get featured businesses
  const { data: featuredBusinesses } = await supabase
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
        photo_type
      )
    `)
    .eq('business_status', 'active')
    .eq('listing_status', 'published')
    .eq('is_premium', true)
    .limit(6)

  // If not enough premium businesses, get regular ones
  let businesses = featuredBusinesses || []
  if (businesses.length < 6) {
    const { data: regularBusinesses } = await supabase
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
          photo_type
        )
      `)
      .eq('business_status', 'active')
      .eq('listing_status', 'published')
      .eq('is_premium', false)
      .order('average_rating', { ascending: false })
      .limit(6 - businesses.length)
    
    businesses = [...businesses, ...(regularBusinesses || [])]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#3a67c9] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Florida&apos;s Premier Boat Marketplace
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Buy, sell, and connect with boat enthusiasts across the Sunshine State
            </p>
            <div className="space-x-4">
              <Link
                href="/boats/new"
                className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Sell Your Boat
              </Link>
              <Link
                href="/boats-for-sale"
                className="inline-block bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
              >
                Browse Boats
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Business Owner CTA */}
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BusinessOwnerCta />
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by make, model, or type..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">All Types</option>
              <option value="bowrider">Bowrider</option>
              <option value="center-console">Center Console</option>
              <option value="cruiser">Cruiser</option>
              <option value="fishing">Fishing Boat</option>
              <option value="pontoon">Pontoon</option>
              <option value="sailboat">Sailboat</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Price Range</option>
              <option value="0-25000">Under $25,000</option>
              <option value="25000-50000">$25,000 - $50,000</option>
              <option value="50000-100000">$50,000 - $100,000</option>
              <option value="100000-250000">$100,000 - $250,000</option>
              <option value="250000+">$250,000+</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Search Boats
            </button>
            <Link
              href="/search"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              View All Boats
            </Link>
          </form>
        </div>
      </div>

      {/* Featured Boats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Recent Listings</h2>
          <p className="mt-2 text-gray-600">Discover the latest boats for sale in Florida</p>
        </div>

        {featuredBoats && featuredBoats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(featuredBoats as Boat[])?.map((boat) => {
              const primaryPhoto = boat.boat_photos?.find((p) => p.is_primary) || boat.boat_photos?.[0]
              const lengthDisplay = boat.length_inches 
                ? `${Math.floor(boat.length_inches / 12)}&apos;${boat.length_inches % 12}"`
                : boat.length_feet ? `${boat.length_feet}ft` : null

              return (
                <Link
                  key={boat.id}
                  href={`/boats/${boat.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  <div className="relative h-48 bg-gray-200">
                    {primaryPhoto ? (
                      <Image
                        src={primaryPhoto.photo_url}
                        alt={boat.title || `${boat.make} ${boat.model}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {boat.price && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-md">
                        ${boat.price.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {boat.title || `${boat.year || ''} ${boat.make} ${boat.model}`.trim()}
                    </h3>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {lengthDisplay && (
                        <p className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          {lengthDisplay}{boat.boat_type ? ` • ${boat.boat_type}` : ''}
                        </p>
                      )}
                      <p className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {formatLocation(boat.location || boat.profiles?.location || 'Florida')}
                      </p>
                    </div>

                    {boat.condition && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          {boat.condition}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No boats available at the moment.</p>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/search"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View All Boats
          </Link>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: 'Center Console', icon: '🚤', count: 45 },
              { name: 'Bowrider', icon: '🛥️', count: 32 },
              { name: 'Fishing Boats', icon: '🎣', count: 58 },
              { name: 'Cruisers', icon: '⛵', count: 27 },
              { name: 'Pontoons', icon: '🛟', count: 19 },
              { name: 'Sailboats', icon: '⛵', count: 14 },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/search?type=${category.name.toLowerCase().replace(' ', '-')}`}
                className="text-center group"
              >
                <div className="bg-gray-100 rounded-lg p-6 group-hover:bg-blue-50 transition-colors">
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.count} listings</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Businesses Section */}
      {businesses.length > 0 && (
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Featured Marine Businesses</h2>
              <p className="mt-2 text-gray-600">Trusted marinas, dealers, and service providers in Florida</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(businesses as Business[]).map((business) => {
                const primaryPhoto = business.photos?.find((p) => p.photo_type === 'logo' || p.photo_type === 'exterior') || business.photos?.[0]
                
                return (
                  <Link
                    key={business.id}
                    href={`/directory/${business.slug}`}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {primaryPhoto ? (
                        <Image
                          src={primaryPhoto.photo_url}
                          alt={business.business_name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                      {business.is_premium && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          Premium
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {business.business_name}
                        </h3>
                        {business.average_rating && business.average_rating > 0 && (
                          <div className="flex items-center text-sm">
                            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="ml-1">{business.average_rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      
                      {business.categories && business.categories.length > 0 && (
                        <p className="text-sm text-gray-600 mb-2">
                          {business.categories.map((c) => c.name).join(', ')}
                        </p>
                      )}

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {business.short_description || business.description}
                      </p>

                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {business.city}, {business.state}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/directory"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View All Businesses
              </Link>
            </div>
          </div>
        </div>
      )}

      
      {/* Why Choose FloBoats */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why Choose FloBoats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Transactions</h3>
              <p className="text-gray-600">Buy and sell with confidence using our secure platform</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Local Community</h3>
              <p className="text-gray-600">Connect with boat enthusiasts in your area</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Verified Listings</h3>
              <p className="text-gray-600">All boats are verified by our team for authenticity</p>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}
