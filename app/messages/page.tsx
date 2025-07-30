'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

interface Conversation {
  id: string
  boat_id: string
  buyer_id: string
  seller_id: string
  last_message_at: string
  buyer_last_read_at: string | null
  seller_last_read_at: string | null
  boats: {
    id: string
    title: string
    make: string
    model: string
    price: number
    boat_photos: {
      photo_url: string
      is_primary: boolean
    }[]
  }
  buyer: {
    id: string
    username: string
    avatar_url: string | null
  }
  seller: {
    id: string
    username: string
    avatar_url: string | null
  }
  last_message?: {
    message: string
    sender_id: string
    created_at: string
    is_read: boolean
  }
}

export default function MessagesPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'buying' | 'selling'>('all')

  useEffect(() => {
    loadConversations()
  }, [filter])

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      setCurrentUserId(user.id)

      // Build query based on filter
      let query = supabase
        .from('conversations')
        .select(`
          *,
          boats (
            id,
            title,
            make,
            model,
            price,
            boat_photos (
              photo_url,
              is_primary
            )
          ),
          buyer:profiles!conversations_buyer_id_fkey (
            id,
            username,
            avatar_url
          ),
          seller:profiles!conversations_seller_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .order('last_message_at', { ascending: false })

      // Apply filter
      if (filter === 'buying') {
        query = query.eq('buyer_id', user.id).eq('is_archived_by_buyer', false)
      } else if (filter === 'selling') {
        query = query.eq('seller_id', user.id).eq('is_archived_by_seller', false)
      } else {
        query = query.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .or(`and(buyer_id.eq.${user.id},is_archived_by_buyer.eq.false),and(seller_id.eq.${user.id},is_archived_by_seller.eq.false)`)
      }

      const { data: conversationsData, error } = await query

      if (error) {
        console.error('Error loading conversations:', error)
        return
      }

      // Load last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('message, sender_id, created_at, is_read')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          return {
            ...conv,
            last_message: lastMessage
          }
        })
      )

      setConversations(conversationsWithLastMessage)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getOtherUser = (conv: Conversation) => {
    return currentUserId === conv.buyer_id ? conv.seller : conv.buyer
  }

  const hasUnreadMessages = (conv: Conversation) => {
    if (!conv.last_message || !currentUserId) return false
    
    // If current user is the sender, no unread
    if (conv.last_message.sender_id === currentUserId) return false
    
    // Check if message is unread
    return !conv.last_message.is_read
  }

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          
          {/* Filter Tabs */}
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Messages
            </button>
            <button
              onClick={() => setFilter('buying')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'buying' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Buying
            </button>
            <button
              onClick={() => setFilter('selling')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'selling' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Selling
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'buying' ? "Messages about boats you're interested in will appear here" : 
                 filter === 'selling' ? "Messages from interested buyers will appear here" :
                 "Start a conversation by contacting a seller"}
              </p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const otherUser = getOtherUser(conversation)
              const unread = hasUnreadMessages(conversation)
              const primaryPhoto = conversation.boats?.boat_photos?.find(p => p.is_primary) || conversation.boats?.boat_photos?.[0]

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className={`block hover:bg-gray-50 transition-colors ${unread ? 'bg-blue-50' : ''}`}
                >
                  <div className="px-6 py-4">
                    <div className="flex items-start space-x-4">
                      {/* Boat Image */}
                      <div className="relative w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {primaryPhoto ? (
                          <Image
                            src={primaryPhoto.photo_url}
                            alt={conversation.boats?.title || 'Boat'}
                            fill
                            sizes="80px"
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

                      {/* Conversation Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              {conversation.boats?.title || `${conversation.boats?.make} ${conversation.boats?.model}`}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <span className="font-medium">{otherUser.username}</span>
                              <span className="mx-2">•</span>
                              <span>{currentUserId === conversation.buyer_id ? 'Seller' : 'Buyer'}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            {conversation.boats?.price && (
                              <p className="text-sm font-semibold text-gray-900">
                                ${conversation.boats.price.toLocaleString()}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {conversation.last_message && formatLastMessageTime(conversation.last_message.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        {conversation.last_message && (
                          <p className={`text-sm mt-2 line-clamp-1 ${unread ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                            {conversation.last_message.sender_id === currentUserId && 'You: '}
                            {conversation.last_message.message}
                          </p>
                        )}
                      </div>

                      {/* Unread Indicator */}
                      {unread && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}