'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { formatLocation } from '@/lib/format-utils'

interface Boat {
  id: string
  title: string
  make: string
  model: string
  year: number | null
  price: number | null
  length_inches: number | null
  beam_inches: number | null
  boat_type: string | null
  condition: string | null
  condition_rating: number | null
  location: string | null
  fuel_type: string | null
  engine_count: number | null
  engine_make: string | null
  engine_model: string | null
  horsepower_per_engine: number | null
  engine_hours: number | null
  hull_material: string | null
  has_title: boolean | null
  has_trailer: boolean | null
  description: string | null
  boat_photos: {
    photo_url: string
    is_primary: boolean
  }[]
}

export default function CompareBoatsPage() {
  const searchParams = useSearchParams()
  const supabase = createBrowserClient()
  const [boats, setBoats] = useState<Boat[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Boat[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    // Load boats from URL params
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []
    if (ids.length > 0) {
      loadBoats(ids)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const loadBoats = async (boatIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('boats')
        .select(`
          *,
          boat_photos (
            photo_url,
            is_primary
          )
        `)
        .in('id', boatIds)
        .eq('status', 'active')

      if (error) throw error
      setBoats(data || [])
    } catch (err) {
      console.error('Error loading boats:', err)
    } finally {
      setLoading(false)
    }
  }

  const searchBoats = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('boats')
        .select(`
          *,
          boat_photos (
            photo_url,
            is_primary
          )
        `)
        .eq('status', 'active')
        .or(`title.ilike.%${searchQuery}%,make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (err) {
      console.error('Error searching boats:', err)
    } finally {
      setSearching(false)
    }
  }

  const addBoat = (boat: Boat) => {
    if (boats.find(b => b.id === boat.id)) return
    if (boats.length >= 4) {
      alert('You can compare up to 4 boats at a time')
      return
    }
    
    const newBoats = [...boats, boat]
    setBoats(newBoats)
    
    // Update URL
    const ids = newBoats.map(b => b.id).join(',')
    window.history.pushState({}, '', `/compare?ids=${ids}`)
    
    // Clear search
    setSearchQuery('')
    setSearchResults([])
  }

  const removeBoat = (boatId: string) => {
    const newBoats = boats.filter(b => b.id !== boatId)
    setBoats(newBoats)
    
    // Update URL
    if (newBoats.length > 0) {
      const ids = newBoats.map(b => b.id).join(',')
      window.history.pushState({}, '', `/compare?ids=${ids}`)
    } else {
      window.history.pushState({}, '', '/compare')
    }
  }

  const formatLength = (inches: number | null) => {
    if (!inches) return 'N/A'
    return `${Math.floor(inches / 12)}'${inches % 12}"`
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'Contact for price'
    return `$${price.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading boats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Compare Boats</h1>
        <p className="mt-2 text-gray-600">Compare up to 4 boats side by side</p>
      </div>

      {/* Add Boat Section */}
      {boats.length < 4 && (
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add a boat to compare</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchBoats()}
              placeholder="Search by title, make, or model..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={searchBoats}
              disabled={searching || !searchQuery.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
              <div className="space-y-2">
                {searchResults.map((boat) => {
                  const isAdded = !!boats.find(b => b.id === boat.id)
                  return (
                    <div
                      key={boat.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">{boat.title}</p>
                        <p className="text-sm text-gray-600">
                          {boat.year} {boat.make} {boat.model} • {formatLocation(boat.location)}
                        </p>
                      </div>
                      <button
                        onClick={() => addBoat(boat)}
                        disabled={isAdded}
                        className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                          isAdded
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isAdded ? 'Added' : 'Add to Compare'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison Table */}
      {boats.length > 0 ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 bg-gray-50">
                    Feature
                  </th>
                  {boats.map((boat) => (
                    <th key={boat.id} className="px-6 py-4 text-center bg-gray-50 relative">
                      <button
                        onClick={() => removeBoat(boat.id)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="text-sm font-medium text-gray-900">{boat.title}</div>
                      <Link
                        href={`/boats/${boat.id}`}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        View Details →
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Photo */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Photo</td>
                  {boats.map((boat) => {
                    const primaryPhoto = boat.boat_photos?.find(p => p.is_primary) || boat.boat_photos?.[0]
                    return (
                      <td key={boat.id} className="px-6 py-4 text-center">
                        {primaryPhoto ? (
                          <Image
                            src={primaryPhoto.photo_url}
                            alt={boat.title}
                            width={200}
                            height={150}
                            className="mx-auto rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-[200px] h-[150px] bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>

                {/* Price */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Price</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">
                      <span className="text-lg font-bold text-blue-600">{formatPrice(boat.price)}</span>
                    </td>
                  ))}
                </tr>

                {/* Basic Info */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Year</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">{boat.year || 'N/A'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Make</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">{boat.make}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Model</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">{boat.model}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Type</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">{boat.boat_type || 'N/A'}</td>
                  ))}
                </tr>

                {/* Dimensions */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Length</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">{formatLength(boat.length_inches)}</td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Beam</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">{formatLength(boat.beam_inches)}</td>
                  ))}
                </tr>

                {/* Engine */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Engine Count</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">{boat.engine_count || 'N/A'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Total HP</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">
                      {boat.horsepower_per_engine ? `${boat.horsepower_per_engine * (boat.engine_count || 1)} HP` : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Engine Hours</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">{boat.engine_hours || 'N/A'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Fuel Type</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">{boat.fuel_type || 'N/A'}</td>
                  ))}
                </tr>

                {/* Other */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Condition</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">
                      {boat.condition_rating ? `${boat.condition_rating}/10` : boat.condition || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Location</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">{formatLocation(boat.location) || 'N/A'}</td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Has Title</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">
                      {boat.has_title === null ? 'N/A' : boat.has_title ? 'Yes' : 'No'}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">Trailer Included</td>
                  {boats.map((boat) => (
                    <td key={boat.id} className="px-6 py-4 text-center">
                      {boat.has_trailer === null ? 'N/A' : boat.has_trailer ? 'Yes' : 'No'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No boats to compare</h3>
          <p className="text-gray-600 mb-6">Start by searching for boats to compare</p>
        </div>
      )}
    </div>
  )
}