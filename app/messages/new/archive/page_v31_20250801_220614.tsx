'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function NewMessagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const boatId = searchParams.get('boat')
  const supabase = createBrowserClient()
  
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [boat, setBoat] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!boatId) {
      router.push('/boats-for-sale')
      return
    }
    
    loadBoatDetails()
  }, [boatId])

  const loadBoatDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Load boat details
      const { data: boatData, error: boatError } = await supabase
        .from('boats')
        .select(`
          *,
          boat_photos (
            photo_url,
            is_primary
          ),
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .eq('id', boatId)
        .eq('status', 'active')
        .single()

      if (boatError || !boatData) {
        setError('Boat not found or no longer available')
        return
      }

      // Check if user owns this boat
      if (boatData.owner_id === user.id) {
        setError("You can't message yourself about your own boat")
        return
      }

      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('boat_id', boatId)
        .eq('buyer_id', user.id)
        .eq('seller_id', boatData.owner_id)
        .single()

      if (existingConv) {
        // Redirect to existing conversation
        router.push(`/messages/${existingConv.id}`)
        return
      }

      setBoat(boatData)
    } catch (err) {
      console.error('Error:', err)
      setError('An error occurred while loading the boat details')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !boat) return

    setSending(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          boat_id: boat.id,
          buyer_id: user.id,
          seller_id: boat.owner_id
        })
        .select()
        .single()

      if (convError) {
        console.error('Error creating conversation:', convError)
        setError('Failed to start conversation')
        return
      }

      // Send first message
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          message: message.trim()
        })

      if (msgError) {
        console.error('Error sending message:', msgError)
        setError('Failed to send message')
        return
      }

      // Redirect to conversation
      router.push(`/messages/${conversation.id}`)
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">{error}</h3>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!boat) return null

  const primaryPhoto = boat.boat_photos?.find((p: any) => p.is_primary) || boat.boat_photos?.[0]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Boat Info */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Contact Seller</h1>
          
          <div className="flex items-start space-x-4">
            <div className="relative w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {primaryPhoto ? (
                <Image
                  src={primaryPhoto.photo_url}
                  alt={boat.title || 'Boat'}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">
                {boat.title || `${boat.year || ''} ${boat.make} ${boat.model}`.trim()}
              </h2>
              {boat.price && (
                <p className="text-lg font-semibold text-blue-600 mt-1">
                  ${boat.price.toLocaleString()}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Seller: {boat.profiles?.username}
              </p>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <form onSubmit={handleSendMessage} className="p-6">
          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Your Message
            </label>
            <textarea
              id="message"
              rows={6}
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              placeholder="Hi, I'm interested in your boat. Is it still available?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Tips for your first message:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Introduce yourself briefly</li>
              <li>• Ask specific questions about the boat</li>
              <li>• Express genuine interest</li>
              <li>• Be respectful and professional</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}