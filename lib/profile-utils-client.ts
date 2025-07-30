import { createBrowserClient } from './supabase/client'

export async function ensureProfileClient(userId: string, email: string) {
  const supabase = createBrowserClient()
  
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()
  
  if (existingProfile) {
    return { exists: true, created: false }
  }
  
  // Create profile if it doesn't exist
  const username = email.split('@')[0] + Math.floor(Math.random() * 1000)
  
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      username: username,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Error creating profile:', error)
    return { exists: false, created: false, error }
  }
  
  return { exists: false, created: true }
}