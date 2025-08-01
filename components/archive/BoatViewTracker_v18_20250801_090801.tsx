'use client'

import { useEffect, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

interface BoatViewTrackerProps {
  boatId: string
}

export default function BoatViewTracker({ boatId }: BoatViewTrackerProps) {
  const supabase = createBrowserClient()
  const viewIdRef = useRef<string | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    // Track the view when component mounts
    const trackView = async () => {
      if (hasTrackedRef.current) return
      hasTrackedRef.current = true

      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        // Get or create session ID
        let sessionId = sessionStorage.getItem('floboats_session_id')
        if (!sessionId) {
          sessionId = uuidv4()
          sessionStorage.setItem('floboats_session_id', sessionId)
        }

        // Call the tracking function
        const { data, error } = await supabase.rpc('track_boat_view', {
          p_boat_id: boatId,
          p_viewer_id: user?.id || null,
          p_user_agent: navigator.userAgent,
          p_referrer: document.referrer,
          p_session_id: sessionId
        })

        if (!error && data) {
          viewIdRef.current = data
        }
      } catch (err) {
        console.error('Error tracking view:', err)
      }
    }

    trackView()

    // Update view duration when component unmounts or page unloads
    const updateDuration = async () => {
      if (viewIdRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
        
        try {
          await supabase.rpc('update_view_duration', {
            p_view_id: viewIdRef.current,
            p_duration: duration
          })
        } catch (err) {
          console.error('Error updating view duration:', err)
        }
      }
    }

    // Handle page unload
    const handleUnload = () => {
      updateDuration()
    }

    window.addEventListener('beforeunload', handleUnload)

    // Cleanup
    return () => {
      updateDuration()
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [boatId, supabase])

  // This component doesn't render anything
  return null
}