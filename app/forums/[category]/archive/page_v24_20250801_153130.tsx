import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, Heart, MessageCircle, Eye, ChevronLeft, TrendingUp, Clock, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ForumThread {
  id: string
  title: string
  slug: string
  content: string
  thread_type: string
  created_at: string
  updated_at: string
  view_count: number
  reply_count: number
  like_count: number
  is_pinned: boolean
  is_locked: boolean
  author_id: string
  author_name: string
  author_username: string
  author_avatar: string | null
  last_reply_at: string
  last_reply_name: string | null
  tags: Array<{
    tag: {
      id: string
      name: string
      slug: string
    }
  }>
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
}

function formatTimeAgo(date: string) {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function CategoryPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ category: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { category: categorySlug } = await params
  const { sort = 'newest' } = await searchParams
  
  const supabase = await createServerClient()
  
  // Get category details
  const { data: category, error: categoryError } = await supabase
    .from('forum_categories')
    .select('*')
    .eq('slug', categorySlug)
    .eq('is_active', true)
    .single()
  
  if (categoryError || !category) {
    notFound()
  }
  
  // Base query for threads
  let threadsQuery = supabase
    .from('forum_threads_with_author')
    .select(`
      *,
      forum_thread_tags(
        tag:forum_tags(
          id,
          name,
          slug
        )
      )
    `)
    .eq('category_id', category.id)
    .eq('is_hidden', false)
  
  // Apply sorting
  switch (sort) {
    case 'popular':
      threadsQuery = threadsQuery.order('like_count', { ascending: false })
      break
    case 'most-replies':
      threadsQuery = threadsQuery.order('reply_count', { ascending: false })
      break
    case 'newest':
    default:
      threadsQuery = threadsQuery.order('created_at', { ascending: false })
  }
  
  const { data: threads } = await threadsQuery
  
  // Separate pinned and regular threads
  const pinnedThreads = threads?.filter(t => t.is_pinned) || []
  const regularThreads = threads?.filter(t => !t.is_pinned) || []
  
  // Get thread count for this category
  const { count: threadCount } = await supabase
    .from('forum_threads')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', category.id)
    .eq('is_hidden', false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/forums" className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{category.icon}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
                <p className="text-gray-600">{category.description}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary">
                {threadCount || 0} {threadCount === 1 ? 'thread' : 'threads'}
              </Badge>
            </div>
            <Link href={`/forums/new?category=${categorySlug}`}>
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                New Thread
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sorting Tabs */}
        <Tabs value={sort} className="mb-6">
          <TabsList>
            <TabsTrigger value="newest" asChild>
              <Link href={`/forums/${categorySlug}?sort=newest`}>
                <Clock className="h-4 w-4 mr-2" />
                Newest
              </Link>
            </TabsTrigger>
            <TabsTrigger value="popular" asChild>
              <Link href={`/forums/${categorySlug}?sort=popular`}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Popular
              </Link>
            </TabsTrigger>
            <TabsTrigger value="most-replies" asChild>
              <Link href={`/forums/${categorySlug}?sort=most-replies`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Most Replies
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Thread List */}
        <div className="space-y-4">
          {/* Pinned Threads */}
          {pinnedThreads.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-gray-700 mb-2">📌 Pinned</h3>
              {pinnedThreads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} categorySlug={categorySlug} isPinned />
              ))}
              <hr className="my-4" />
            </>
          )}
          
          {/* Regular Threads */}
          {regularThreads.length === 0 && pinnedThreads.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No threads yet</h3>
                <p className="text-gray-600 mb-4">
                  Be the first to start a discussion in this category!
                </p>
                <Link href={`/forums/new?category=${categorySlug}`}>
                  <Button>Start the First Thread</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            regularThreads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} categorySlug={categorySlug} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function ThreadCard({ thread, categorySlug, isPinned = false }: { 
  thread: ForumThread
  categorySlug: string
  isPinned?: boolean 
}) {
  const threadTypeColors = {
    question: 'bg-purple-100 text-purple-800',
    discussion: 'bg-blue-100 text-blue-800',
    announcement: 'bg-yellow-100 text-yellow-800',
    poll: 'bg-green-100 text-green-800'
  }
  
  return (
    <Link href={`/forums/${categorySlug}/${thread.slug}`}>
      <Card className={`hover:shadow-lg transition-shadow ${isPinned ? 'border-yellow-400' : ''}`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Author Avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={thread.author_avatar || undefined} />
              <AvatarFallback>
                {thread.author_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Thread Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600">
                    {thread.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${threadTypeColors[thread.thread_type as keyof typeof threadTypeColors] || ''}`}
                    >
                      {thread.thread_type}
                    </Badge>
                    {thread.tags?.map((tagItem) => (
                      <Badge key={tagItem.tag.id} variant="outline" className="text-xs">
                        {tagItem.tag.name}
                      </Badge>
                    ))}
                    {thread.is_locked && (
                      <Badge variant="secondary" className="text-xs">
                        🔒 Locked
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Thread Stats */}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="font-medium">{thread.author_name}</span>
                <span>•</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {thread.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {thread.reply_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {thread.like_count}
                  </span>
                </div>
              </div>
              
              {/* Last Activity */}
              <div className="text-xs text-gray-500 mt-2">
                {thread.reply_count > 0 && thread.last_reply_name ? (
                  <>
                    Last reply by <span className="font-medium">{thread.last_reply_name}</span> • {' '}
                    {formatTimeAgo(thread.last_reply_at)}
                  </>
                ) : (
                  <>Started {formatTimeAgo(thread.created_at)}</>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}