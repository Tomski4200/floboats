import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/profile-utils'
import Link from 'next/link'
import Image from 'next/image'
import { MessageSquare, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function ProfilePage() {
  const supabase = await createServerClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  console.log('Profile page - Auth check:', { 
    hasUser: !!user, 
    userId: user?.id,
    authError: authError?.message 
  })
  
  if (!user) {
    redirect('/login')
  }

  // Ensure profile exists
  const profileStatus = await ensureProfile(user.id, user.email!, true)
  
  if (profileStatus.error) {
    console.error('Error ensuring profile:', profileStatus.error)
  }

  // Get user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Profile fetch error:', error)
    // Profile doesn't exist or error
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Unable to load profile. Error: {error.message}</p>
          <p className="text-sm text-yellow-700 mt-2">User ID: {user.id}</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Profile not found. Please complete your profile setup.</p>
          <Link href="/profile/edit" className="text-blue-600 hover:underline mt-2 inline-block">
            Create Profile
          </Link>
        </div>
      </div>
    )
  }

  // Get user's boats count
  const { count: boatsCount } = await supabase
    .from('boats')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)
  
  // Get user's forum activity
  const { data: forumActivity } = await supabase
    .from('user_forum_activity')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)
  
  // Count threads and replies
  const threadCount = forumActivity?.filter(a => a.activity_type === 'thread').length || 0
  const replyCount = forumActivity?.filter(a => a.activity_type === 'reply').length || 0

  // Get avatar URL if exists
  const avatarUrl = profile.avatar_url 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}/${profile.avatar_url}`
    : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`${profile.first_name || profile.username}'s avatar`}
                    width={96}
                    height={96}
                    className="rounded-full border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">
                      {(profile.first_name || profile.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Name and Username */}
              <div className="text-white">
                <h1 className="text-3xl font-bold">
                  {profile.first_name && profile.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile.username}
                </h1>
                <p className="text-blue-100">@{profile.username}</p>
                {profile.location && (
                  <p className="text-blue-100 mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {profile.location}
                  </p>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <Link
              href="/profile/edit"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - About */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              {profile.bio && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              {/* Contact Info */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Information</h2>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {profile.email}
                  </div>
                  {profile.phone && (
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {profile.phone}
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {profile.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Forum Activity */}
              {forumActivity && forumActivity.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Recent Forum Activity</h2>
                  <div className="space-y-3">
                    {forumActivity.slice(0, 5).map((activity: any) => (
                      <div key={activity.item_id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {activity.activity_type === 'thread' ? (
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <MessageCircle className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            {activity.activity_type === 'thread' ? (
                              <span className="font-medium">Started a thread</span>
                            ) : (
                              <span className="font-medium">Replied to</span>
                            )}
                            {' in '}
                            <Badge variant="secondary" className="text-xs">
                              {activity.category_name}
                            </Badge>
                          </p>
                          <Link 
                            href={`/forums/${activity.category_slug}/${activity.slug}`}
                            className="text-blue-600 hover:underline text-sm mt-1 block truncate"
                          >
                            {activity.title}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {forumActivity.length > 5 && (
                    <p className="text-sm text-gray-500 mt-3 text-center">
                      And {forumActivity.length - 5} more forum activities...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-6">
              {/* Stats Card */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-blue-600">{boatsCount || 0}</p>
                    <p className="text-gray-600">Boats Listed</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-blue-600">{profile.reputation_score || 0}</p>
                    <p className="text-gray-600">Reputation Score</p>
                  </div>
                  {(threadCount > 0 || replyCount > 0) && (
                    <>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{threadCount}</p>
                        <p className="text-gray-600">Forum Threads</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{replyCount}</p>
                        <p className="text-gray-600">Forum Replies</p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">
                      Member since {new Date(profile.created_at).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link 
                    href="/dashboard"
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    View Dashboard
                  </Link>
                  <Link 
                    href="/boats"
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    Manage My Boats
                  </Link>
                  <Link 
                    href="/boats/new"
                    className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Boat
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}