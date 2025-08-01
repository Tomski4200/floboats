'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function BoatPhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [boat, setBoat] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])

  useEffect(() => {
    loadBoatAndPhotos()
  }, [resolvedParams.id])

  const loadBoatAndPhotos = async () => {
    try {
      // Get boat details
      const { data: boatData, error: boatError } = await supabase
        .from('boats')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (boatError) {
        console.error('Error loading boat:', boatError)
        router.push('/boats')
        return
      }

      setBoat(boatData)

      // Get boat photos
      const { data: photosData, error: photosError } = await supabase
        .from('boat_photos')
        .select('*')
        .eq('boat_id', resolvedParams.id)
        .order('display_order', { ascending: true })

      if (photosData) {
        setPhotos(photosData)
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return
    }

    setUploading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user owns this boat
      if (boat.owner_id !== user.id) {
        setError('You do not have permission to upload photos for this boat')
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${resolvedParams.id}_${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload image to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('boat-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError('Failed to upload image')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('boat-photos')
        .getPublicUrl(filePath)

      // Save photo record to database
      const { data: photoData, error: dbError } = await supabase
        .from('boat_photos')
        .insert({
          boat_id: resolvedParams.id,
          photo_url: publicUrl,
          storage_path: filePath,
          is_primary: photos.length === 0, // First photo is primary
          display_order: photos.length,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        setError('Failed to save photo information')
        return
      }

      // Update local state
      setPhotos([...photos, photoData])
      
      // Clear file input
      event.target.value = ''
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setUploading(false)
    }
  }

  const handleSetPrimary = async (photoId: string) => {
    setLoading(true)
    try {
      // Update all photos to not primary
      await supabase
        .from('boat_photos')
        .update({ is_primary: false })
        .eq('boat_id', resolvedParams.id)

      // Set selected photo as primary
      await supabase
        .from('boat_photos')
        .update({ is_primary: true })
        .eq('id', photoId)

      // Reload photos
      await loadBoatAndPhotos()
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to update primary photo')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string, storagePath: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }

    setLoading(true)
    try {
      // Delete from storage
      await supabase.storage
        .from('boat-photos')
        .remove([storagePath])

      // Delete from database
      await supabase
        .from('boat_photos')
        .delete()
        .eq('id', photoId)

      // Reload photos
      await loadBoatAndPhotos()
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to delete photo')
    } finally {
      setLoading(false)
    }
  }

  if (!boat) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Manage Photos</h1>
          <p className="mt-1 text-sm text-gray-600">
            {boat.title}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Upload Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Photos
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Photos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="aspect-w-16 aspect-h-12 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={photo.photo_url}
                    alt="Boat photo"
                    width={400}
                    height={300}
                    className="object-cover"
                  />
                </div>
                {photo.is_primary && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Primary
                  </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                  {!photo.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(photo.id)}
                      disabled={loading}
                      className="bg-white text-gray-700 px-2 py-1 rounded text-xs font-medium hover:bg-gray-100"
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePhoto(photo.id, photo.storage_path)}
                    disabled={loading}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {photos.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No photos</h3>
              <p className="mt-1 text-sm text-gray-500">Upload photos to showcase your boat</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
            <Link
              href="/boats"
              className="text-gray-600 hover:text-gray-900"
            >
              Back to My Boats
            </Link>
            <div className="space-x-4">
              <Link
                href={`/boats/${resolvedParams.id}/edit`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit Details
              </Link>
              <Link
                href={`/boats/${resolvedParams.id}`}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                View Listing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}