'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'

interface SaveBoatButtonProps {
  boatId: string
  showText?: boolean
  className?: string
}

export default function SaveBoatButton({ boatId, showText = true, className = '' }: SaveBoatButtonProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  useEffect(() => {
    checkIfSaved()
  }, [boatId])

  const checkIfSaved = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('saved_boats')
        .select('id')
        .eq('user_id', user.id)
        .eq('boat_id', boatId)
        .single()

      if (!error && data) {
        setIsSaved(true)
        setSavedId(data.id)
      }
    } catch (err) {
      console.error('Error checking saved status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    setSaving(true)
    try {
      if (isSaved && savedId) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_boats')
          .delete()
          .eq('id', savedId)

        if (!error) {
          setIsSaved(false)
          setSavedId(null)
        }
      } else {
        // Add to saved
        const { data, error } = await supabase
          .from('saved_boats')
          .insert({
            user_id: user.id,
            boat_id: boatId
          })
          .select()
          .single()

        if (!error && data) {
          setIsSaved(true)
          setSavedId(data.id)
        }
      }
    } catch (err) {
      console.error('Error toggling save:', err)
    } finally {
      setSaving(false)
    }
  }

  const defaultClassName = showText
    ? "w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
    : "p-2 rounded-full hover:bg-gray-100 transition-colors"

  if (loading) {
    return (
      <button className={className || defaultClassName} disabled>
        {showText ? 'Loading...' : (
          <svg className="w-5 h-5 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleToggleSave}
      disabled={saving}
      className={className || defaultClassName}
      title={isSaved ? 'Remove from saved' : 'Save this boat'}
    >
      {isSaved ? (
        <>
          <svg className={`${showText ? 'w-5 h-5' : 'w-6 h-6'} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          {showText && <span>Saved</span>}
        </>
      ) : (
        <>
          <svg className={`${showText ? 'w-5 h-5' : 'w-6 h-6'} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {showText && <span>Save Listing</span>}
        </>
      )}
    </button>
  )
}