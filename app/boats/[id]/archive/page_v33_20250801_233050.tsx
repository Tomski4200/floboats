import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import SaveBoatButton from '@/components/SaveBoatButton'
import BoatViewTracker from '@/components/BoatViewTracker'
import CompareButton from '@/components/CompareButton'
import { formatLocation } from '@/lib/format-utils'

export default async function BoatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createServerClient()

  // Get boat details with owner profile
  const { data: boat, error: boatError } = await supabase
    .from('boats')
    .select(`
      *,
      profiles (
        id,
        username,
        first_name,
        last_name,
        avatar_url,
        location,
        phone,
        email
      )
    `)
    .eq('id', resolvedParams.id)
    .eq('status', 'active')
    .single()

  if (boatError || !boat) {
    notFound()
  }

  // Get boat photos
  const { data: photos } = await supabase
    .from('boat_photos')
    .select('*')
    .eq('boat_id', resolvedParams.id)
    .order('display_order', { ascending: true })

  const primaryPhoto = photos?.find(p => p.is_primary) || photos?.[0]
  const owner = boat.profiles

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BoatViewTracker boatId={boat.id} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Photo Gallery */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {primaryPhoto ? (
              <div className="aspect-w-16 aspect-h-12">
                <Image
                  src={primaryPhoto.photo_url}
                  alt={boat.title}
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="aspect-w-16 aspect-h-12 bg-gray-200 flex items-center justify-center">
                <svg className="h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* Thumbnail Gallery */}
            {photos && photos.length > 1 && (
              <div className="p-4 border-t">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="aspect-w-1 aspect-h-1">
                      <Image
                        src={photo.photo_url}
                        alt="Boat photo"
                        width={100}
                        height={100}
                        className="object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Boat Details */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900">{boat.title}</h1>
            
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {formatLocation(boat.location)}
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Listed {new Date(boat.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Price */}
            {boat.price && (
              <div className="mt-6">
                <p className="text-3xl font-bold text-blue-600">
                  ${boat.price.toLocaleString()}
                </p>
              </div>
            )}

            {/* Specifications */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Specifications</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Make</p>
                  <p className="font-medium">{boat.make}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Model</p>
                  <p className="font-medium">{boat.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Year</p>
                  <p className="font-medium">{boat.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Length</p>
                  <p className="font-medium">
                    {boat.length_inches ? 
                      `${Math.floor(boat.length_inches / 12)}'${boat.length_inches % 12}"` : 
                      'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Beam</p>
                  <p className="font-medium">
                    {boat.beam_inches ? 
                      `${Math.floor(boat.beam_inches / 12)}'${boat.beam_inches % 12}"` : 
                      'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{boat.boat_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Condition</p>
                  <p className="font-medium">{boat.condition}</p>
                </div>
                {boat.engine_hours && (
                  <div>
                    <p className="text-sm text-gray-600">Engine Hours</p>
                    <p className="font-medium">{boat.engine_hours}</p>
                  </div>
                )}
                {boat.fuel_type && (
                  <div>
                    <p className="text-sm text-gray-600">Fuel Type</p>
                    <p className="font-medium">{boat.fuel_type}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Engine Details */}
            {(boat.engine_make || boat.engine_model || boat.engine_count > 1 || boat.horsepower_per_engine) && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Engine</h2>
                <div className="grid grid-cols-2 gap-4">
                  {boat.engine_count && (
                    <div>
                      <p className="text-sm text-gray-600">Number of Engines</p>
                      <p className="font-medium">{boat.engine_count}</p>
                    </div>
                  )}
                  {boat.horsepower_per_engine && (
                    <div>
                      <p className="text-sm text-gray-600">Total Horsepower</p>
                      <p className="font-medium">{boat.horsepower_per_engine * (boat.engine_count || 1)} HP</p>
                    </div>
                  )}
                  {boat.engine_make && (
                    <div>
                      <p className="text-sm text-gray-600">Make</p>
                      <p className="font-medium">{boat.engine_make}</p>
                    </div>
                  )}
                  {boat.engine_model && (
                    <div>
                      <p className="text-sm text-gray-600">Model</p>
                      <p className="font-medium">{boat.engine_model}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Legal Information */}
            {(boat.hull_id || boat.has_title !== null) && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Documentation</h2>
                <div className="grid grid-cols-2 gap-4">
                  {boat.hull_id && (
                    <div>
                      <p className="text-sm text-gray-600">Hull ID (HIN)</p>
                      <p className="font-medium">{boat.hull_id}</p>
                    </div>
                  )}
                  {boat.has_title !== null && (
                    <div>
                      <p className="text-sm text-gray-600">Title Status</p>
                      <p className="font-medium">{boat.has_title ? 'Title in Hand' : 'Title Not Available'}</p>
                    </div>
                  )}
                  {boat.has_trailer !== null && (
                    <div>
                      <p className="text-sm text-gray-600">Trailer</p>
                      <p className="font-medium">{boat.has_trailer ? 'Included' : 'Not Included'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {boat.description && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{boat.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Contact Seller */}
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Seller</h2>
            
            {owner && (
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  {owner.avatar_url ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${owner.id}/${owner.avatar_url}`}
                      alt={owner.username}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-600">
                        {owner.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {owner.first_name && owner.last_name 
                        ? `${owner.first_name} ${owner.last_name}`
                        : owner.username}
                    </p>
                    {owner.location && (
                      <p className="text-sm text-gray-600">{formatLocation(owner.location)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Link
                href={`/messages/new?boat=${boat.id}`}
                className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
              >
                Send Message
              </Link>
              
              {owner?.phone && (
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                  Call Seller
                </button>
              )}
              
              <SaveBoatButton boatId={boat.id} />
              
              <CompareButton boatId={boat.id} className="w-full" />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Share This Listing</h3>
              <div className="flex space-x-3">
                <button className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Facebook
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Twitter
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Email
                </button>
              </div>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="mt-6 bg-yellow-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Safety Tips</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Always inspect the boat in person</li>
              <li>• Get a marine survey before purchase</li>
              <li>• Verify ownership documentation</li>
              <li>• Use secure payment methods</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}