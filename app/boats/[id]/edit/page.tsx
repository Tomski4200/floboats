'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'

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

const conditions = [
  'New',
  'Excellent',
  'Good',
  'Fair',
  'Needs Work'
]

export default function EditBoatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  interface BoatFormData {
    title: string
    make: string
    model: string
    year: number
    price: number
    description: string
    length_feet?: number | null
    length_inches?: number | null
    boat_type: string
    engine_type?: string | null
    engine_hours?: number | null
    condition: string
    location: string
    contact_email?: string | null
    contact_phone?: string | null
    features?: string | null
  }

  const [formData, setFormData] = useState<BoatFormData | null>(null)

  useEffect(() => {
    loadBoat()
  }, [resolvedParams.id])

  const loadBoat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('boats')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('owner_id', user.id)
        .single()

      if (error || !data) {
        console.error('Error loading boat:', error)
        router.push('/boats')
        return
      }

      setFormData(data)
    } catch (err) {
      console.error('Error:', err)
      router.push('/boats')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData) {
      setError('Form data not loaded')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Prepare updated data
      const updateData = {
        title: formData.title,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year.toString()),
        length_feet: formData.length_feet ? parseInt(formData.length_feet.toString()) : null,
        boat_type: formData.boat_type,
        condition: formData.condition,
        price: formData.price ? parseFloat(formData.price.toString()) : null,
        location: formData.location,
        description: formData.description,
        engine_hours: formData.engine_hours ? parseInt(formData.engine_hours.toString()) : null,
        engine_make: formData.engine_make,
        engine_model: formData.engine_model,
        fuel_type: formData.fuel_type,
        hull_material: formData.hull_material,
        is_featured: formData.is_featured,
        status: formData.status,
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('boats')
        .update(updateData)
        .eq('id', resolvedParams.id)
        .eq('owner_id', user.id)

      if (updateError) {
        console.error('Error updating boat:', updateError)
        setError(updateError.message)
        return
      }

      // Redirect back to boats list
      router.push('/boats')
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading boat details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Edit Boat Listing</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update your boat details below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Listing Title *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700">
                  Make *
                </label>
                <input
                  type="text"
                  name="make"
                  id="make"
                  required
                  value={formData.make}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  id="model"
                  required
                  value={formData.model}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Year *
                </label>
                <input
                  type="number"
                  name="year"
                  id="year"
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="length_feet" className="block text-sm font-medium text-gray-700">
                  Length (feet)
                </label>
                <input
                  type="number"
                  name="length_feet"
                  id="length_feet"
                  min="1"
                  value={formData.length_feet || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="boat_type" className="block text-sm font-medium text-gray-700">
                  Boat Type *
                </label>
                <select
                  name="boat_type"
                  id="boat_type"
                  required
                  value={formData.boat_type}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a type</option>
                  {boatTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                  Condition *
                </label>
                <select
                  name="condition"
                  id="condition"
                  required
                  value={formData.condition}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select condition</option>
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  id="price"
                  min="0"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Engine Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Engine Information</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="engine_make" className="block text-sm font-medium text-gray-700">
                  Engine Make
                </label>
                <input
                  type="text"
                  name="engine_make"
                  id="engine_make"
                  value={formData.engine_make || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="engine_model" className="block text-sm font-medium text-gray-700">
                  Engine Model
                </label>
                <input
                  type="text"
                  name="engine_model"
                  id="engine_model"
                  value={formData.engine_model || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="engine_hours" className="block text-sm font-medium text-gray-700">
                  Engine Hours
                </label>
                <input
                  type="number"
                  name="engine_hours"
                  id="engine_hours"
                  min="0"
                  value={formData.engine_hours || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700">
                  Fuel Type
                </label>
                <select
                  name="fuel_type"
                  id="fuel_type"
                  value={formData.fuel_type || 'Gas'}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="Gas">Gas</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="hull_material" className="block text-sm font-medium text-gray-700">
                  Hull Material
                </label>
                <input
                  type="text"
                  name="hull_material"
                  id="hull_material"
                  value={formData.hull_material || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={6}
                  value={formData.description || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Link
              href="/boats"
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </Link>
            <div className="space-x-4">
              <Link
                href={`/boats/${resolvedParams.id}/photos`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage Photos
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}