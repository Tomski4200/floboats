import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

interface Boat {
  id: string
  make: string
  model: string
  year: number | null
  length_feet: number | null
  length_inches: number | null
  boat_type: string | null
  condition_rating: number | null
  is_for_sale: boolean
  created_at: string
  boat_photos: {
    photo_url: string
    is_primary: boolean
  }[]
  view_count?: number
  message_count?: number
  save_count?: number
}

export default async function MyBoatsPage() {
  const supabase = await createServerClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's boats with primary photo and today's stats
  const { data: boats, error } = await supabase
    .from('boats')
    .select(`
      *,
      boat_photos (
        photo_url,
        is_primary
      )
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  // Get today's analytics for all boats
  if (boats) {
    const today = new Date().toISOString().split('T')[0]
    const { data: analytics } = await supabase
      .from('boat_analytics')
      .select('boat_id, view_count, save_count, message_count')
      .in('boat_id', boats.map(b => b.id))
      .eq('date', today)

    // Merge analytics data with boats
    if (analytics) {
      boats.forEach(boat => {
        const stats = analytics.find(a => a.boat_id === boat.id)
        if (stats) {
          boat.view_count = stats.view_count
          boat.save_count = stats.save_count
          boat.message_count = stats.message_count
        }
      })
    }
  }

  if (error) {
    console.error('Error fetching boats:', error)
  }

  const typedBoats = boats as Boat[] || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Boats</h1>
          <p className="mt-2 text-gray-600">Manage your boat listings</p>
        </div>
        <Link
          href="/boats/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Boat
        </Link>
      </div>

      {typedBoats.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No boats yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first boat</p>
          <Link
            href="/boats/new"
            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Boat
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {typedBoats.map((boat) => {
            const primaryPhoto = boat.boat_photos?.find(p => p.is_primary) || boat.boat_photos?.[0]
            const photoUrl = primaryPhoto?.photo_url || null

            return (
              <div key={boat.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Boat Image */}
                <div className="relative h-48 bg-gray-200">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={`${boat.make} ${boat.model}`}
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
                  {boat.is_for_sale && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-md text-sm font-medium">
                      For Sale
                    </div>
                  )}
                </div>

                {/* Boat Details */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {boat.year ? `${boat.year} ` : ''}{boat.make} {boat.model}
                  </h3>
                  
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {(boat.length_feet || boat.length_inches) && (
                      <p className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        {boat.length_inches ? 
                          `${Math.floor(boat.length_inches / 12)}&apos;${boat.length_inches % 12}&quot;` : 
                          `${boat.length_feet}ft`
                        }
                      </p>
                    )}
                    {boat.boat_type && (
                      <p className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {boat.boat_type.replace(/_/g, ' ').charAt(0).toUpperCase() + boat.boat_type.slice(1).replace(/_/g, ' ')}
                      </p>
                    )}
                    {boat.condition_rating && (
                      <p className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Condition: {boat.condition_rating}/10
                      </p>
                    )}
                  </div>

                  {/* Today's Stats */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-600 font-medium mb-1">Today&apos;s Activity</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {boat.view_count || 0} views
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {boat.save_count || 0} saves
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {boat.message_count || 0} msgs
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Link
                      href={`/boats/${boat.id}`}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                    >
                      View
                    </Link>
                    <Link
                      href={`/boats/${boat.id}/edit`}
                      className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/boats/${boat.id}/analytics`}
                      className="bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors text-center"
                    >
                      Analytics
                    </Link>
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