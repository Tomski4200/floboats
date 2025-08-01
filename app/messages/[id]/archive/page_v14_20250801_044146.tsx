'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  message: string
  is_read: boolean
  created_at: string
  sender: {
    id: string
    username: string
    avatar_url: string | null
  }
}

interface ConversationDetails {
  id: string
  boat_id: string
  buyer_id: string
  seller_id: string
  boats: {
    id: string
    title: string
    make: string
    model: string
    price: number
    status: string
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
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const supabase = createBrowserClient()
  const [conversation, setConversation] = useState<ConversationDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    loadConversation()
  }, [resolvedParams.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      setCurrentUserId(user.id)

      // Load conversation details
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          boats (
            id,
            title,
            make,
            model,
            price,
            status,
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
        .eq('id', resolvedParams.id)
        .single()

      if (convError || !convData) {
        console.error('Error loading conversation:', convError)
        router.push('/messages')
        return
      }

      // Verify user is part of this conversation
      if (convData.buyer_id !== user.id && convData.seller_id !== user.id) {
        router.push('/messages')
        return
      }

      setConversation(convData)

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', resolvedParams.id)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Error loading messages:', messagesError)
      } else {
        setMessages(messagesData || [])
        
        // Mark messages as read
        await markMessagesAsRead(messagesData || [], user.id)
      }

      // Subscribe to new messages
      if (!isSubscribed) {
        const channel = supabase
          .channel(`messages:${resolvedParams.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${resolvedParams.id}`
            },
            async (payload) => {
              // Fetch the complete message with sender info
              const { data: newMsg } = await supabase
                .from('messages')
                .select(`
                  *,
                  sender:profiles!messages_sender_id_fkey (
                    id,
                    username,
                    avatar_url
                  )
                `)
                .eq('id', payload.new.id)
                .single()

              if (newMsg) {
                setMessages(prev => [...prev, newMsg])
                
                // Mark as read if from other user
                if (newMsg.sender_id !== user.id) {
                  await markMessagesAsRead([newMsg], user.id)
                }
              }
            }
          )
          .subscribe()

        setIsSubscribed(true)

        // Cleanup subscription on unmount
        return () => {
          supabase.removeChannel(channel)
        }
      }
    } catch (err) {
      console.error('Error:', err)
      router.push('/messages')
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async (messages: Message[], userId: string) => {
    const unreadMessageIds = messages
      .filter(msg => msg.sender_id !== userId && !msg.is_read)
      .map(msg => msg.id)

    if (unreadMessageIds.length > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadMessageIds)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId || !conversation) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          message: newMessage.trim()
        })

      if (error) {
        console.error('Error sending message:', error)
      } else {
        setNewMessage('')
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return null
  }

  const otherUser = currentUserId === conversation.buyer_id ? conversation.seller : conversation.buyer
  const primaryPhoto = conversation.boats?.boat_photos?.find(p => p.is_primary) || conversation.boats?.boat_photos?.[0]

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/messages"
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Boat Info */}
          <Link
            href={`/boats/${conversation.boats.id}`}
            className="flex items-center space-x-3 flex-1 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
          >
            <div className="relative w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {primaryPhoto ? (
                <Image
                  src={primaryPhoto.photo_url}
                  alt={conversation.boats.title || 'Boat'}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">
                {conversation.boats.title || `${conversation.boats.make} ${conversation.boats.model}`}
              </h2>
              <p className="text-sm text-gray-600">
                ${conversation.boats.price?.toLocaleString()} • 
                <span className="ml-1">{otherUser.username} ({currentUserId === conversation.buyer_id ? 'Seller' : 'Buyer'})</span>
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === currentUserId
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwn ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 px-2">
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t px-4 py-4">
        {conversation.boats.status !== 'active' && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              This boat listing is no longer active.
            </p>
          </div>
        )}
        
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}