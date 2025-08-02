'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MessageSquare, Eye } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

export default function NewThreadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: searchParams.get('category') || '',
    thread_type: 'discussion'
  })
  
  useEffect(() => {
    if (!user) {
      router.push('/auth/sign-in?redirect=/forums/new')
      return
    }
    
    loadCategories()
    loadTags()
  }, [user])
  
  async function loadCategories() {
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from('forum_categories')
      .select('id, name, slug, icon')
      .eq('is_active', true)
      .order('sort_order')
    
    if (data) {
      setCategories(data)
      
      // Set category from URL if provided
      const categorySlug = searchParams.get('category')
      if (categorySlug) {
        const category = data.find(c => c.slug === categorySlug)
        if (category) {
          setFormData(prev => ({ ...prev, category_id: category.id }))
        }
      }
    }
  }
  
  async function loadTags() {
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from('forum_tags')
      .select('*')
      .order('name')
    
    if (data) {
      setTags(data)
    }
  }
  
  function toggleTag(tagId: string) {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a thread.",
        variant: "destructive"
      })
      return
    }
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.category_id) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const supabase = createBrowserClient()
      
      // Create the thread
      const { data: thread, error: threadError } = await supabase
        .from('forum_threads')
        .insert({
          title: formData.title.trim(),
          content: formData.content.trim(),
          category_id: formData.category_id,
          thread_type: formData.thread_type,
          author_id: user.id
        })
        .select('id, slug, category:forum_categories!category_id(slug)')
        .single()
      
      if (threadError) throw threadError
      
      // Add tags if any selected
      if (selectedTags.length > 0 && thread) {
        const tagInserts = selectedTags.map(tagId => ({
          thread_id: thread.id,
          tag_id: tagId
        }))
        
        await supabase
          .from('forum_thread_tags')
          .insert(tagInserts)
      }
      
      toast({
        title: "Thread created!",
        description: "Your thread has been posted successfully.",
      })
      
      // Redirect to the new thread
      router.push(`/forums/${thread.category.slug}/${thread.slug}`)
    } catch (error) {
      console.error('Error creating thread:', error)
      toast({
        title: "Error creating thread",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const selectedCategory = categories.find(c => c.id === formData.category_id)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/forums" className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-gray-700" />
              <h1 className="text-2xl font-bold text-gray-900">Create New Thread</h1>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thread Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category */}
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category">
                      {selectedCategory && (
                        <div className="flex items-center gap-2">
                          <span>{selectedCategory.icon}</span>
                          <span>{selectedCategory.name}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Thread Type */}
              <div>
                <Label>Thread Type</Label>
                <RadioGroup
                  value={formData.thread_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, thread_type: value }))}
                  className="grid grid-cols-2 gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="discussion" id="discussion" />
                    <Label htmlFor="discussion" className="font-normal cursor-pointer">
                      💬 Discussion
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="question" id="question" />
                    <Label htmlFor="question" className="font-normal cursor-pointer">
                      ❓ Question
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="announcement" id="announcement" />
                    <Label htmlFor="announcement" className="font-normal cursor-pointer">
                      📢 Announcement
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="poll" id="poll" />
                    <Label htmlFor="poll" className="font-normal cursor-pointer">
                      📊 Poll
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a descriptive title for your thread"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/200 characters
                </p>
              </div>
              
              {/* Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="content">Content *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? 'Edit' : 'Preview'}
                  </Button>
                </div>
                {showPreview ? (
                  <div className="min-h-[200px] p-4 border rounded-md bg-gray-50 prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">{formData.content || 'Nothing to preview...'}</div>
                  </div>
                ) : (
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your thread content here..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Markdown formatting is supported
                </p>
              </div>
              
              {/* Tags */}
              <div>
                <Label>Tags (optional)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Submit Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Thread'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}