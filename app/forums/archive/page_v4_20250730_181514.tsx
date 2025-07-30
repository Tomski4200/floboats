import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageSquare, TrendingUp, Users, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ForumCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  thread_count?: number
  latest_thread?: {
    title: string
    author_name: string
    created_at: string
  }
}

interface RecentThread {
  id: string
  title: string
  slug: string
  created_at: string
  reply_count: number
  like_count: number
  category: {
    name: string
    slug: string
  }
  author_name: string
  author_username: string
  author_avatar: string | null
}

interface TopContributor {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  reputation_score: number
  thread_count: number
  reply_count: number
}

export default async function ForumsPage() {
  const supabase = await createServerClient()
  
  // Get categories with thread counts
  const { data: categories } = await supabase
    .from('forum_categories')
    .select(`
      *,
      threads:forum_threads(count)
    `)
    .eq('is_active', true)
    .order('sort_order')
  
  // Get recent threads
  const { data: recentThreadsData } = await supabase
    .from('forum_threads_with_author')
    .select(`
      id,
      title,
      slug,
      created_at,
      reply_count,
      like_count,
      category:forum_categories!category_id(
        name,
        slug
      ),
      author_name,
      author_username,
      author_avatar
    `)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(5)
  
  const recentThreads = recentThreadsData || []
  
  // Get top contributors (users with highest reputation from forum activity)
  const { data: topContributors } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      first_name,
      last_name,
      avatar_url,
      reputation_score
    `)
    .order('reputation_score', { ascending: false })
    .limit(5)
  
  // Get thread and reply counts for top contributors
  const contributorsWithStats = await Promise.all(
    (topContributors || []).map(async (user) => {
      const { count: threadCount } = await supabase
        .from('forum_threads')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .eq('is_hidden', false)
      
      const { count: replyCount } = await supabase
        .from('forum_replies')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .eq('is_hidden', false)
      
      return {
        ...user,
        full_name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`
          : null,
        thread_count: threadCount || 0,
        reply_count: replyCount || 0
      }
    })
  )
  
  // Get latest thread for each category
  const categoriesWithLatest = await Promise.all(
    (categories || []).map(async (category) => {
      const { data: latestThread } = await supabase
        .from('forum_threads_with_author')
        .select('title, author_name, created_at')
        .eq('category_id', category.id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      return {
        ...category,
        thread_count: category.threads?.[0]?.count || 0,
        latest_thread: latestThread
      }
    })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Forums</h1>
              <p className="mt-2 text-gray-600">
                Join the discussion with fellow boating enthusiasts
              </p>
            </div>
            <Link href="/forums/new">
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Start New Thread
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Categories */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Browse Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoriesWithLatest.map((category) => (
                <Link key={category.id} href={`/forums/${category.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {category.thread_count} {category.thread_count === 1 ? 'thread' : 'threads'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                      {category.latest_thread && (
                        <div className="text-xs text-gray-500 border-t pt-3">
                          <p className="font-medium text-gray-700 truncate">
                            {category.latest_thread.title}
                          </p>
                          <p className="mt-1">
                            by {category.latest_thread.author_name} • {' '}
                            {new Date(category.latest_thread.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentThreads.length === 0 ? (
                    <p className="text-sm text-gray-500">No threads yet. Be the first to start a discussion!</p>
                  ) : (
                    recentThreads.map((thread) => (
                      <div key={thread.id} className="border-b last:border-0 pb-3 last:pb-0">
                        <Link 
                          href={`/forums/${thread.category.slug}/${thread.slug}`}
                          className="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
                        >
                          <p className="font-medium text-sm text-gray-900 line-clamp-1">
                            {thread.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {thread.category.name}
                            </Badge>
                            <span>•</span>
                            <span>{thread.reply_count} replies</span>
                            <span>•</span>
                            <span>{thread.like_count} likes</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            by {thread.author_name}
                          </p>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contributorsWithStats.length === 0 ? (
                    <p className="text-sm text-gray-500">No contributors yet!</p>
                  ) : (
                    contributorsWithStats.map((user, index) => (
                      <Link 
                        key={user.id} 
                        href={`/profile/${user.username}`}
                        className="flex items-center gap-3 hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>
                                {(user.full_name || user.username).substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {index < 3 && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold">{index + 1}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {user.full_name || user.username}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.reputation_score} points • {user.thread_count} threads • {user.reply_count} replies
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Forum Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Categories</span>
                    <span className="font-medium">{categories?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Threads</span>
                    <span className="font-medium">
                      {categoriesWithLatest.reduce((sum, cat) => sum + cat.thread_count, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Contributors</span>
                    <span className="font-medium">
                      {contributorsWithStats.filter(u => u.reputation_score > 0).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}