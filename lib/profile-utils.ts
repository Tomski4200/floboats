import { createServerClient } from './supabase/server'

export async function ensureProfile(userId: string, email: string) {
  const supabase = await createServerClient()
  
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