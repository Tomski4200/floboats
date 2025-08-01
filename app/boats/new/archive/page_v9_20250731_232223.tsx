'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatCity, formatState } from '@/lib/format-utils'

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

export default function NewBoatPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    length_feet: '',
    length_inches: '',
    beam_feet: '',
    beam_inches: '',
    boat_types: [] as string[],
    condition: '',
    price: '',
    city: '',
    state: '',
    description: '',
    has_trailer: 'no',
    no_engine: false,
    engine_hours: '',
    engine_make: '',
    engine_model: '',
    engine_count: '1',
    horsepower_per_engine: '',
    fuel_type: 'Gas',
    hull_material: '',
    hull_id: '',
    has_title: 'yes',
    is_featured: false,
    status: 'active'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (name === 'boat_types') {
      const checkbox = e.target as HTMLInputElement
      setFormData(prev => ({
        ...prev,
        boat_types: checkbox.checked 
          ? [...prev.boat_types, value]
          : prev.boat_types.filter(t => t !== value)
      }))
    } else if (name === 'no_engine') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        no_engine: checked,
        engine_count: checked ? '0' : '1'
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Validate boat types
      if (formData.boat_types.length === 0) {
        setError('Please select at least one boat type')
        setLoading(false)
        return
      }

      if (formData.boat_types.length > 3) {
        setError('Please select up to 3 boat types only')
        setLoading(false)
        return
      }

      // Calculate total length in inches
      const lengthInches = (parseInt(formData.length_feet || '0') * 12) + parseInt(formData.length_inches || '0')
      const beamInches = (parseInt(formData.beam_feet || '0') * 12) + parseInt(formData.beam_inches || '0')

      // Prepare boat data
      const boatData = {
        title: formData.title,
        make: formData.make,
        model: formData.model,
        owner_id: user.id,
        year: parseInt(formData.year.toString()),
        length_inches: lengthInches || null,
        beam_inches: beamInches || null,
        boat_type: formData.boat_types.join(', '), // Store as comma-separated string
        condition: formData.condition,
        price: formData.price ? parseInt(formData.price) : null,
        location: `${formatCity(formData.city)}, ${formatState(formData.state)}`,
        description: formData.description || null,
        has_trailer: formData.has_trailer === 'yes',
        engine_hours: formData.no_engine ? null : (formData.engine_hours ? parseInt(formData.engine_hours) : null),
        engine_make: formData.no_engine ? null : (formData.engine_make || null),
        engine_model: formData.no_engine ? null : (formData.engine_model || null),
        engine_count: parseInt(formData.engine_count),
        horsepower_per_engine: formData.no_engine ? null : (formData.horsepower_per_engine ? parseInt(formData.horsepower_per_engine) : null),
        fuel_type: formData.no_engine ? null : (formData.fuel_type || null),
        hull_material: formData.hull_material || null,
        hull_id: formData.hull_id || null,
        has_title: formData.has_title === 'yes',
        status: formData.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Submitting boat data:', boatData)

      const { data, error: insertError } = await supabase
        .from('boats')
        .insert(boatData)
        .select()
        .single()

      if (insertError) {
        console.error('Error creating boat:', insertError)
        console.error('Error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        })
        setError(insertError.message || insertError.details || 'Failed to create boat listing. Please check all required fields.')
        return
      }

      // Redirect to boat page or photo upload
      router.push(`/boats/${data.id}/photos`)
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">List Your Boat</h1>
          <p className="mt-1 text-sm text-gray-600">
            Fill in the details below to create your boat listing
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
                  placeholder="e.g., 2020 Sea Ray Sundancer 320"
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
                  placeholder="e.g., Sea Ray"
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
                  placeholder="e.g., Sundancer 320"
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
                <label className="block text-sm font-medium text-gray-700">
                  Length *
                </label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      name="length_feet"
                      id="length_feet"
                      min="0"
                      required
                      value={formData.length_feet}
                      onChange={handleChange}
                      placeholder="Feet"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="length_inches"
                      id="length_inches"
                      min="0"
                      max="11"
                      value={formData.length_inches}
                      onChange={handleChange}
                      placeholder="Inches"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Beam
                </label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      name="beam_feet"
                      id="beam_feet"
                      min="0"
                      value={formData.beam_feet}
                      onChange={handleChange}
                      placeholder="Feet"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="beam_inches"
                      id="beam_inches"
                      min="0"
                      max="11"
                      value={formData.beam_inches}
                      onChange={handleChange}
                      placeholder="Inches"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Trailer Included?
                </label>
                <div className="mt-2 space-x-6">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="has_trailer"
                      value="yes"
                      checked={formData.has_trailer === 'yes'}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="has_trailer"
                      value="no"
                      checked={formData.has_trailer === 'no'}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Boat Type * (Select up to 3)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {boatTypes.map(type => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="boat_types"
                        value={type}
                        checked={formData.boat_types.includes(type)}
                        onChange={handleChange}
                        disabled={formData.boat_types.length >= 3 && !formData.boat_types.includes(type)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
                {formData.boat_types.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {formData.boat_types.join(', ')}
                  </p>
                )}
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
                  Price $USD
                </label>
                <input
                  type="number"
                  name="price"
                  id="price"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g., 125000"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  id="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Miami"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  id="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g., FL"
                  maxLength={2}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Required Legal Information */}
            <div className="col-span-2 mt-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">Legal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hull_id" className="block text-sm font-medium text-gray-700">
                    Hull Identification Number (HIN) *
                  </label>
                  <input
                    type="text"
                    name="hull_id"
                    id="hull_id"
                    required
                    value={formData.hull_id}
                    onChange={handleChange}
                    placeholder="e.g., ABC12345D404"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">12-character HIN required for all boats</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Do you have the title in hand? *
                  </label>
                  <div className="mt-2 space-x-6">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="has_title"
                        value="yes"
                        checked={formData.has_title === 'yes'}
                        onChange={handleChange}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="has_title"
                        value="no"
                        checked={formData.has_title === 'no'}
                        onChange={handleChange}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Engine Information */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Engine Information</h2>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="no_engine"
                  checked={formData.no_engine}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">No Engine</span>
              </label>
            </div>
            <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${formData.no_engine ? 'opacity-50' : ''}`}>
              <div>
                <label htmlFor="engine_count" className="block text-sm font-medium text-gray-700">
                  Number of Engines *
                </label>
                <select
                  name="engine_count"
                  id="engine_count"
                  required
                  value={formData.engine_count}
                  onChange={handleChange}
                  disabled={formData.no_engine}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5+</option>
                </select>
              </div>

              <div>
                <label htmlFor="horsepower_per_engine" className="block text-sm font-medium text-gray-700">
                  Horsepower per Engine
                </label>
                <input
                  type="number"
                  name="horsepower_per_engine"
                  id="horsepower_per_engine"
                  min="0"
                  value={formData.horsepower_per_engine}
                  onChange={handleChange}
                  placeholder="e.g., 350"
                  disabled={formData.no_engine}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="engine_make" className="block text-sm font-medium text-gray-700">
                  Engine Make
                </label>
                <input
                  type="text"
                  name="engine_make"
                  id="engine_make"
                  value={formData.engine_make}
                  onChange={handleChange}
                  placeholder="e.g., Mercury"
                  disabled={formData.no_engine}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  value={formData.engine_model}
                  onChange={handleChange}
                  placeholder="e.g., Verado 350"
                  disabled={formData.no_engine}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  value={formData.engine_hours}
                  onChange={handleChange}
                  placeholder="e.g., 250"
                  disabled={formData.no_engine}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700">
                  Fuel Type
                </label>
                <select
                  name="fuel_type"
                  id="fuel_type"
                  value={formData.fuel_type}
                  onChange={handleChange}
                  disabled={formData.no_engine}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  value={formData.hull_material}
                  onChange={handleChange}
                  placeholder="e.g., Fiberglass"
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
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your boat's features, condition, upgrades, etc."
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
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}