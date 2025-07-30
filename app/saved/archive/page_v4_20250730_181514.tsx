'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { formatLocation } from '@/lib/format-utils'

interface SavedBoat {
  id: string
  boat_id: string
  saved_at: string
  notes: string | null
  boats: {
    id: string
    title: string
    make: string
    model: string
    year: number
    price: number
    location: string
    status: string
    length_inches: number | null
    boat_type: string
    condition: string
    boat_photos: {
      photo_url: string
      is_primary: boolean
    }[]
    profiles: {
      username: string
    }
  }
}

export default function SavedBoatsPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [savedBoats, setSavedBoats] = useState<SavedBoat[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'sold'>('active')

  useEffect(() => {
    loadSavedBoats()
  }, [filter])

  const loadSavedBoats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      let query = supabase
        .from('saved_boats')
        .select(`
          *,
          boats (
            *,
            boat_photos (
              photo_url,
              is_primary
            ),
            profiles (
              username
            )
          )
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false })

      // Apply filter
      if (filter === 'active') {
        query = query.eq('boats.status', 'active')
      } else if (filter === 'sold') {
        query = query.neq('boats.status', 'active')
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading saved boats:', error)
      } else {
        setSavedBoats(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSaved = async (savedId: string) => {
    if (!confirm('Remove this boat from your saved list?')) return

    try {
      const { error } = await supabase
        .from('saved_boats')
        .delete()
        .eq('id', savedId)

      if (error) {
        console.error('Error removing saved boat:', error)
      } else {
        setSavedBoats(prev => prev.filter(sb => sb.id !== savedId))
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const updateNotes = async (savedId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('saved_boats')
        .update({ notes })
        .eq('id', savedId)

      if (error) {
        console.error('Error updating notes:', error)
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading saved boats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Saved Boats</h1>
        <p className="mt-2 text-gray-600">Keep track of boats you're interested in</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setFilter('active')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            filter === 'active' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Available ({savedBoats.filter(sb => sb.boats?.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('sold')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            filter === 'sold' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Sold/Inactive ({savedBoats.filter(sb => sb.boats?.status !== 'active').length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            filter === 'all' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({savedBoats.length})
        </button>
      </div>

      {savedBoats.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No saved boats</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start browsing and save boats you're interested in
          </p>
          <Link
            href="/boats-for-sale"
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Boats
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedBoats
            .filter(sb => {
              if (filter === 'active') return sb.boats?.status === 'active'
              if (filter === 'sold') return sb.boats?.status !== 'active'
              return true
            })
            .map((savedBoat) => {
              const boat = savedBoat.boats
              if (!boat) return null

              const primaryPhoto = boat.boat_photos?.find(p => p.is_primary) || boat.boat_photos?.[0]
              const lengthDisplay = boat.length_inches 
                ? `${Math.floor(boat.length_inches / 12)}'${boat.length_inches % 12}"`
                : null

              return (
                <div key={savedBoat.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="relative">
                    <Link href={`/boats/${boat.id}`} className="block">
                      <div className="relative h-48 bg-gray-200">
                        {primaryPhoto ? (
                          <Image
                            src={primaryPhoto.photo_url}
                            alt={boat.title || `${boat.make} ${boat.model}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
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
                        {boat.status !== 'active' && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium">
                            {boat.status === 'sold' ? 'Sold' : 'Inactive'}
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveSaved(savedBoat.id)}
                      className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                      title="Remove from saved"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-4">
                    <Link href={`/boats/${boat.id}`} className="block hover:text-blue-600">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                        {boat.title || `${boat.year || ''} ${boat.make} ${boat.model}`.trim()}
                      </h3>
                    </Link>
                    
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
                        {formatLocation(boat.location)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Saved {new Date(savedBoat.saved_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Notes section */}
                    <div className="mt-3">
                      <textarea
                        placeholder="Add notes..."
                        value={savedBoat.notes || ''}
                        onChange={(e) => {
                          const newNotes = e.target.value
                          setSavedBoats(prev => 
                            prev.map(sb => 
                              sb.id === savedBoat.id 
                                ? { ...sb, notes: newNotes }
                                : sb
                            )
                          )
                          // Debounce the save
                          const timeoutId = setTimeout(() => {
                            updateNotes(savedBoat.id, newNotes)
                          }, 1000)
                          return () => clearTimeout(timeoutId)
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={2}
                      />
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex space-x-2">
                      <Link
                        href={`/boats/${boat.id}`}
                        className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                      >
                        View Details
                      </Link>
                      {boat.status === 'active' && (
                        <Link
                          href={`/messages/new?boat=${boat.id}`}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                        >
                          Contact Seller
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}