'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import SaveBoatButton from '@/components/SaveBoatButton'
import CompareButton from '@/components/CompareButton'
import { formatLocation } from '@/lib/format-utils'

const boatTypes = [
  'Bowrider',
  'Center Console',
  'Cruiser',
  'Deck Boat',
  'Fishing Boat',
  'Pontoon',
  'Sailboat',
  'Ski/Wake Boat',
  'Yacht',
  'Other'
]

const priceRanges = [
  { label: 'Any Price', min: 0, max: null },
  { label: 'Under $25,000', min: 0, max: 25000 },
  { label: '$25,000 - $50,000', min: 25000, max: 50000 },
  { label: '$50,000 - $100,000', min: 50000, max: 100000 },
  { label: '$100,000 - $250,000', min: 100000, max: 250000 },
  { label: '$250,000 - $500,000', min: 250000, max: 500000 },
  { label: 'Over $500,000', min: 500000, max: null }
]

const lengthRanges = [
  { label: 'Any Length', min: 0, max: null },
  { label: 'Under 20 ft', min: 0, max: 240 }, // 240 inches = 20 feet
  { label: '20 - 30 ft', min: 240, max: 360 },
  { label: '30 - 40 ft', min: 360, max: 480 },
  { label: '40 - 50 ft', min: 480, max: 600 },
  { label: 'Over 50 ft', min: 600, max: null }
]

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient()
  
  const [boats, setBoats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '')
  const [priceRange, setPriceRange] = useState({ min: 0, max: null as number | null })
  const [lengthRange, setLengthRange] = useState({ min: 0, max: null as number | null })
  const [yearMin, setYearMin] = useState('')
  const [yearMax, setYearMax] = useState('')
  const [location, setLocation] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    searchBoats()
  }, [searchTerm, selectedType, priceRange, lengthRange, yearMin, yearMax, location, sortBy, sortOrder, currentPage])

  const searchBoats = async () => {
    setLoading(true)
    try {
      let query = supabase
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
        `, { count: 'exact' })
        .eq('status', 'active')

      // Apply search term
      if (searchTerm) {
        query = query.or(`make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`)
      }

      // Apply type filter
      if (selectedType) {
        query = query.ilike('boat_type', `%${selectedType}%`)
      }

      // Apply price range
      if (priceRange.min > 0) {
        query = query.gte('price', priceRange.min)
      }
      if (priceRange.max) {
        query = query.lte('price', priceRange.max)
      }

      // Apply length range
      if (lengthRange.min > 0) {
        query = query.gte('length_inches', lengthRange.min)
      }
      if (lengthRange.max) {
        query = query.lte('length_inches', lengthRange.max)
      }

      // Apply year range
      if (yearMin) {
        query = query.gte('year', parseInt(yearMin))
      }
      if (yearMax) {
        query = query.lte('year', parseInt(yearMax))
      }

      // Apply location filter
      if (location) {
        query = query.ilike('location', `%${location}%`)
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Search error:', error)
      } else {
        setBoats(data || [])
        setTotalCount(count || 0)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePriceRangeChange = (range: typeof priceRanges[0]) => {
    setPriceRange({ min: range.min, max: range.max })
    setCurrentPage(1)
  }

  const handleLengthRangeChange = (range: typeof lengthRanges[0]) => {
    setLengthRange({ min: range.min, max: range.max })
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedType('')
    setPriceRange({ min: 0, max: null })
    setLengthRange({ min: 0, max: null })
    setYearMin('')
    setYearMax('')
    setLocation('')
    setSortBy('created_at')
    setSortOrder('desc')
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Make, model, or keyword"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Boat Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Boat Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  {boatTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  onChange={(e) => handlePriceRangeChange(priceRanges[parseInt(e.target.value)])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {priceRanges.map((range, idx) => (
                    <option key={idx} value={idx}>{range.label}</option>
                  ))}
                </select>
              </div>

              {/* Length Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length
                </label>
                <select
                  onChange={(e) => handleLengthRangeChange(lengthRanges[parseInt(e.target.value)])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {lengthRanges.map((range, idx) => (
                    <option key={idx} value={idx}>{range.label}</option>
                  ))}
                </select>
              </div>

              {/* Year Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={yearMin}
                    onChange={(e) => {
                      setYearMin(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Min"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    value={yearMax}
                    onChange={(e) => {
                      setYearMax(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder="Max"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="City or State"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Sort and Results Count */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-gray-700">
                  {loading ? 'Searching...' : `${totalCount} boats found`}
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Sort by:</label>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-')
                      setSortBy(field)
                      setSortOrder(order as 'asc' | 'desc')
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="created_at-desc">Newest First</option>
                    <option value="created_at-asc">Oldest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="year-desc">Year: Newest First</option>
                    <option value="year-asc">Year: Oldest First</option>
                    <option value="length_inches-asc">Length: Small to Large</option>
                    <option value="length_inches-desc">Length: Large to Small</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Boat Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Searching boats...</p>
              </div>
            ) : boats.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {boats.map((boat) => {
                    const primaryPhoto = boat.boat_photos?.find((p: any) => p.is_primary) || boat.boat_photos?.[0]
                    const lengthDisplay = boat.length_inches 
                      ? `${Math.floor(boat.length_inches / 12)}'${boat.length_inches % 12}"`
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
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                          <div className="absolute top-2 right-2 flex flex-col gap-2">
                            <SaveBoatButton boatId={boat.id} showText={false} className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors" />
                            <CompareButton boatId={boat.id} showText={false} className="bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors" />
                          </div>
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
                                {lengthDisplay} • {boat.boat_type}
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 rounded-md text-sm font-medium ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return <span key={page} className="px-2">...</span>
                        }
                        return null
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No boats found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your filters</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}