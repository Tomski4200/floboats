import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function TestEventPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  console.log('Test page - params:', params)
  const { id } = await params
  console.log('Test page - id:', id)
  
  const supabase = await createServerClient()
  
  const { data: event, error } = await supabase
    .from('events')
    .select('id, title')
    .eq('id', id)
    .single()
  
  console.log('Test page - event:', event)
  console.log('Test page - error:', error)
  
  if (!event) {
    notFound()
  }
  
  return (
    <div>
      <h1>Event: {event.title}</h1>
      <p>ID: {event.id}</p>
    </div>
  )
}