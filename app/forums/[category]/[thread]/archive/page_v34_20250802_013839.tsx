'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Heart, MessageCircle, Eye, Lock, AlertCircle, Edit, Trash2, Reply as ReplyIcon } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'

interface ThreadDetails {
  id: string
  title: string
  content: string
  thread_type: string
  created_at: string
  updated_at: string
  edited_at: string | null
  view_count: number
  reply_count: number
  like_count: number
  is_pinned: boolean
  is_locked: boolean
  is_hidden: boolean
  author_id: string
  author_name: string
  author_username: string
  author_avatar: string | null
  category: {
    id: string
    name: string
    slug: string
    icon: string
  }
  tags: Array<{
    tag: {
      id: string
      name: string
      slug: string
    }
  }>
}

interface Reply {
  id: string
  content: string
  created_at: string
  updated_at: string
  edited_at: string | null
  like_count: number
  author_id: string
  author_name: string
  author_username: string
  author_avatar: string | null
  author_reputation: number
  parent_reply_id: string | null
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function ThreadPage({ 
  params 
}: { 
  params: Promise<{ category: string; thread: string }> 
}) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [thread, setThread] = useState<ThreadDetails | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userLikedThread, setUserLikedThread] = useState(false)
  const [userLikedReplies, setUserLikedReplies] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    loadThread()
  }, [params])
  
  useEffect(() => {
    if (thread && user) {
      checkUserLikes()
    }
  }, [thread, user])
  
  async function loadThread() {
    try {
      const { category: categorySlug, thread: threadSlug } = await params
      const supabase = createBrowserClient()
      
      // Get thread details
      const { data: threadData, error: threadError } = await supabase
        .from('forum_threads')
        .select(`
          *,
          author:profiles!author_id(
            id,
            username,
            first_name,
            last_name,
            avatar_url
          ),
          category:forum_categories!category_id(
            id,
            name,
            slug,
            icon
          ),
          tags:forum_thread_tags(
            tag:forum_tags(
              id,
              name,
              slug
            )
          )
        `)
        .eq('slug', threadSlug)
        .eq('category.slug', categorySlug)
        .single()
      
      if (threadError || !threadData) {
        notFound()
      }
      
      setThread(threadData)
      
      // Increment view count
      await supabase.rpc('increment', {
        table_name: 'forum_threads',
        column_name: 'view_count',
        row_id: threadData.id
      })
      
      // Get replies
      const { data: repliesData } = await supabase
        .from('forum_replies')
        .select(`
          *,
          author:profiles!author_id(
            id,
            username,
            first_name,
            last_name,
            avatar_url,
            reputation_score
          )
        `)
        .eq('thread_id', threadData.id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true })
      
      setReplies(repliesData || [])
    } catch (error) {
      console.error('Error loading thread:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function checkUserLikes() {
    if (!user || !thread) return
    
    const supabase = createBrowserClient()
    
    // Check if user liked the thread
    const { data: threadLike } = await supabase
      .from('forum_thread_likes')
      .select('id')
      .eq('thread_id', thread.id)
      .eq('user_id', user.id)
      .single()
    
    setUserLikedThread(!!threadLike)
    
    // Check which replies user liked
    const { data: replyLikes } = await supabase
      .from('forum_reply_likes')
      .select('reply_id')
      .eq('user_id', user.id)
      .in('reply_id', replies.map(r => r.id))
    
    setUserLikedReplies(new Set(replyLikes?.map(rl => rl.reply_id) || []))
  }
  
  async function handleThreadLike() {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like threads.",
        variant: "destructive"
      })
      return
    }
    
    const supabase = createBrowserClient()
    
    if (userLikedThread) {
      // Unlike
      await supabase
        .from('forum_thread_likes')
        .delete()
        .eq('thread_id', thread?.id)
        .eq('user_id', user.id)
      
      setUserLikedThread(false)
      setThread(prev => prev ? { ...prev, like_count: prev.like_count - 1 } : prev)
    } else {
      // Like
      await supabase
        .from('forum_thread_likes')
        .insert({ thread_id: thread?.id, user_id: user.id })
      
      setUserLikedThread(true)
      setThread(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : prev)
    }
  }
  
  async function handleReplyLike(replyId: string) {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like replies.",
        variant: "destructive"
      })
      return
    }
    
    const supabase = createBrowserClient()
    const isLiked = userLikedReplies.has(replyId)
    
    if (isLiked) {
      // Unlike
      await supabase
        .from('forum_reply_likes')
        .delete()
        .eq('reply_id', replyId)
        .eq('user_id', user.id)
      
      setUserLikedReplies(prev => {
        const newSet = new Set(prev)
        newSet.delete(replyId)
        return newSet
      })
      
      setReplies(prev => prev.map(r => 
        r.id === replyId ? { ...r, like_count: r.like_count - 1 } : r
      ))
    } else {
      // Like
      await supabase
        .from('forum_reply_likes')
        .insert({ reply_id: replyId, user_id: user.id })
      
      setUserLikedReplies(prev => new Set(prev).add(replyId))
      
      setReplies(prev => prev.map(r => 
        r.id === replyId ? { ...r, like_count: r.like_count + 1 } : r
      ))
    }
  }
  
  async function handleReplySubmit() {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to reply to threads.",
        variant: "destructive"
      })
      return
    }
    
    if (!replyContent.trim()) {
      toast({
        title: "Empty reply",
        description: "Please write something before submitting.",
        variant: "destructive"
      })
      return
    }
    
    if (thread?.is_locked) {
      toast({
        title: "Thread locked",
        description: "This thread is locked and cannot receive new replies.",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const supabase = createBrowserClient()
      
      const { data: newReply, error } = await supabase
        .from('forum_replies')
        .insert({
          thread_id: thread?.id,
          author_id: user.id,
          parent_reply_id: replyingTo,
          content: replyContent.trim()
        })
        .select(`
          *,
          author:profiles!author_id(
            id,
            username,
            first_name,
            last_name,
            avatar_url,
            reputation_score
          )
        `)
        .single()
      
      if (error) throw error
      
      // Format the reply to match our interface
      const formattedReply: Reply = {
        ...newReply,
        author_name: newReply.author.first_name && newReply.author.last_name
          ? `${newReply.author.first_name} ${newReply.author.last_name}`
          : newReply.author.username,
        author_username: newReply.author.username,
        author_avatar: newReply.author.avatar_url,
        author_reputation: newReply.author.reputation_score,
        parent_reply_id: newReply.parent_reply_id
      }
      
      setReplies(prev => [...prev, formattedReply])
      setReplyContent('')
      setReplyingTo(null)
      
      toast({
        title: "Reply posted!",
        description: "Your reply has been added to the thread.",
      })
    } catch (error) {
      console.error('Error posting reply:', error)
      toast({
        title: "Error posting reply",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }
  
  if (!thread) {
    notFound()
  }
  
  const threadTypeColors = {
    question: 'bg-purple-100 text-purple-800',
    discussion: 'bg-blue-100 text-blue-800',
    announcement: 'bg-yellow-100 text-yellow-800',
    poll: 'bg-green-100 text-green-800'
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/forums" className="text-gray-600 hover:text-gray-900">
              Forums
            </Link>
            <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180" />
            <Link 
              href={`/forums/${thread.category.slug}`} 
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <span>{thread.category.icon}</span>
              {thread.category.name}
            </Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Thread */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
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
                  {thread.is_pinned && <Badge variant="secondary">📌 Pinned</Badge>}
                  {thread.is_locked && <Badge variant="secondary">🔒 Locked</Badge>}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{thread.title}</h1>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage src={thread.author_avatar || undefined} />
                <AvatarFallback>
                  {thread.author_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{thread.author_name}</p>
                <p className="text-sm text-gray-500">
                  Posted {formatDate(thread.created_at)}
                  {thread.edited_at && ' • edited'}
                </p>
              </div>
            </div>
            
            {/* Content */}
            <div className="prose prose-sm max-w-none mb-4">
              <div className="whitespace-pre-wrap">{thread.content}</div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant={userLikedThread ? "primary" : "outline"}
                size="sm"
                onClick={handleThreadLike}
              >
                <Heart className={`h-4 w-4 mr-1 ${userLikedThread ? 'fill-current' : ''}`} />
                {thread.like_count}
              </Button>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {thread.view_count} views
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {thread.reply_count} replies
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Replies */}
        <div className="space-y-4 mb-6">
          {replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              onLike={() => handleReplyLike(reply.id)}
              isLiked={userLikedReplies.has(reply.id)}
              onReply={() => setReplyingTo(reply.id)}
              isNested={!!reply.parent_reply_id}
            />
          ))}
        </div>
        
        {/* Reply Form */}
        {!thread.is_locked ? (
          <Card>
            <CardHeader>
              <h3 className="font-semibold">
                {replyingTo ? 'Reply to comment' : 'Add a reply'}
              </h3>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-4">
                  <Textarea
                    value={replyContent}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyContent(e.target.value)}
                    placeholder="Write your reply..."
                    rows={4}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Be respectful and constructive in your reply
                    </p>
                    <div className="flex items-center gap-2">
                      {replyingTo && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(null)}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        onClick={handleReplySubmit}
                        disabled={isSubmitting || !replyContent.trim()}
                      >
                        {isSubmitting ? 'Posting...' : 'Post Reply'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-2">Sign in to join the discussion</p>
                  <Link href="/auth/sign-in">
                    <Button>Sign In</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Lock className="h-5 w-5" />
                <p>This thread is locked and cannot receive new replies</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function ReplyCard({ 
  reply, 
  onLike, 
  isLiked, 
  onReply, 
  isNested 
}: { 
  reply: Reply
  onLike: () => void
  isLiked: boolean
  onReply: () => void
  isNested: boolean
}) {
  return (
    <Card className={isNested ? 'ml-12' : ''}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={reply.author_avatar || undefined} />
            <AvatarFallback>
              {reply.author_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm">{reply.author_name}</p>
              <Badge variant="secondary" className="text-xs">
                {reply.author_reputation} points
              </Badge>
              <span className="text-xs text-gray-500">
                {formatDate(reply.created_at)}
                {reply.edited_at && ' • edited'}
              </span>
            </div>
            
            <div className="prose prose-sm max-w-none mb-2">
              <div className="whitespace-pre-wrap">{reply.content}</div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLike}
                className="h-7 px-2"
              >
                <Heart className={`h-3 w-3 mr-1 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                {reply.like_count}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onReply}
                className="h-7 px-2"
              >
                <ReplyIcon className="h-3 w-3 mr-1" />
                Reply
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
