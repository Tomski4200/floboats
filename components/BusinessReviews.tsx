'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, CheckCircle } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface Review {
  id: string
  rating: number
  title: string
  review_text: string
  service_date: string
  service_type: string
  would_recommend: boolean
  helpful_votes: number
  verified_customer: boolean
  created_at: string
  reviewer: {
    id: string
    full_name: string
    avatar_url: string
  }
  response_text?: string
  response_date?: string
  user_helpful_vote?: boolean
}

interface BusinessReviewsProps {
  businessId: string
}

export default function BusinessReviews({ businessId }: BusinessReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [hasReviewed, setHasReviewed] = useState(false)
  
  const supabase = createBrowserClient()
  const { toast } = useToast()
  
  useEffect(() => {
    loadReviews()
    checkCurrentUser()
  }, [businessId])
  
  async function loadReviews() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      let query = supabase
        .from('business_reviews')
        .select(`
          *,
          reviewer:profiles!reviewer_id(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('business_id', businessId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
      
      const { data: reviews, error } = await query
      
      if (error) throw error
      
      // If user is logged in, check which reviews they found helpful
      if (user && reviews) {
        const reviewIds = reviews.map(r => r.id)
        const { data: helpfulVotes } = await supabase
          .from('review_helpfulness')
          .select('review_id')
          .eq('user_id', user.id)
          .in('review_id', reviewIds)
          .eq('is_helpful', true)
        
        const helpfulReviewIds = new Set(helpfulVotes?.map(v => v.review_id) || [])
        
        setReviews(reviews.map(review => ({
          ...review,
          user_helpful_vote: helpfulReviewIds.has(review.id)
        })))
      } else {
        setReviews(reviews || [])
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function checkCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUser(user)
      
      // Check if user has already reviewed this business
      const { data } = await supabase
        .from('business_reviews')
        .select('id')
        .eq('business_id', businessId)
        .eq('reviewer_id', user.id)
        .single()
      
      setHasReviewed(!!data)
    }
  }
  
  async function handleSubmitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!currentUser) return
    
    setSubmitting(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      const reviewData = {
        business_id: businessId,
        reviewer_id: currentUser.id,
        rating: parseInt(formData.get('rating') as string),
        title: formData.get('title') as string,
        review_text: formData.get('review_text') as string,
        service_date: formData.get('service_date') as string,
        service_type: formData.get('service_type') as string,
        would_recommend: formData.get('would_recommend') === 'true'
      }
      
      const { error } = await supabase
        .from('business_reviews')
        .insert(reviewData)
      
      if (error) throw error
      
      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!'
      })
      
      setShowReviewForm(false)
      loadReviews()
      setHasReviewed(true)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  async function handleHelpfulVote(reviewId: string, isHelpful: boolean) {
    if (!currentUser) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to vote on reviews'
      })
      return
    }
    
    try {
      const { error } = await supabase
        .from('review_helpfulness')
        .upsert({
          review_id: reviewId,
          user_id: currentUser.id,
          is_helpful: isHelpful
        })
      
      if (error) throw error
      
      // Update helpful count
      if (isHelpful) {
        await supabase.rpc('increment', {
          table_name: 'business_reviews',
          column_name: 'helpful_votes',
          row_id: reviewId
        })
      }
      
      loadReviews()
    } catch (error) {
      console.error('Error voting on review:', error)
    }
  }
  
  if (loading) {
    return <div>Loading reviews...</div>
  }
  
  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-bold">
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {reviews.length} reviews
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviews.filter(r => r.rating === rating).length
                  const percentage = (count / reviews.length) * 100
                  
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm w-3">{rating}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-10 text-right">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {currentUser && !hasReviewed && (
            <Button
              className="w-full mt-4"
              onClick={() => setShowReviewForm(true)}
            >
              Write a Review
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <Label>Rating</Label>
                <RadioGroup name="rating" required>
                  <div className="flex gap-4">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center">
                        <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                        <Label htmlFor={`rating-${rating}`} className="ml-1 cursor-pointer">
                          {rating} {rating === 1 ? 'star' : 'stars'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label htmlFor="title">Review Title</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Summarize your experience"
                />
              </div>
              
              <div>
                <Label htmlFor="review_text">Your Review</Label>
                <Textarea
                  id="review_text"
                  name="review_text"
                  required
                  rows={4}
                  placeholder="Tell others about your experience"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_date">Service Date</Label>
                  <Input
                    id="service_date"
                    name="service_date"
                    type="date"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="service_type">Service Type</Label>
                  <Input
                    id="service_type"
                    name="service_type"
                    placeholder="e.g., Boat storage, Engine repair"
                  />
                </div>
              </div>
              
              <div>
                <Label>Would you recommend this business?</Label>
                <RadioGroup name="would_recommend" defaultValue="true">
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <RadioGroupItem value="true" id="recommend-yes" />
                      <Label htmlFor="recommend-yes" className="ml-1">Yes</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="false" id="recommend-no" />
                      <Label htmlFor="recommend-no" className="ml-1">No</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Reviews List */}
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {review.reviewer.avatar_url ? (
                  <img
                    src={review.reviewer.avatar_url}
                    alt={review.reviewer.full_name}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {review.reviewer.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{review.reviewer.full_name}</p>
                    {review.verified_customer && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified Customer
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(review.created_at), 'MMM d, yyyy')}
                    </span>
                    {review.service_type && (
                      <span className="text-sm text-muted-foreground">
                        • {review.service_type}
                      </span>
                    )}
                  </div>
                  
                  <h4 className="font-semibold mt-3">{review.title}</h4>
                  <p className="mt-2 whitespace-pre-wrap">{review.review_text}</p>
                  
                  {review.would_recommend && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Would recommend
                    </p>
                  )}
                  
                  {/* Business Response */}
                  {review.response_text && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-semibold mb-1">Business Response</p>
                      <p className="text-sm">{review.response_text}</p>
                      {review.response_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(review.response_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHelpfulVote(review.id, true)}
                      disabled={!currentUser || review.user_helpful_vote}
                    >
                      <ThumbsUp className={`h-4 w-4 mr-1 ${review.user_helpful_vote ? 'fill-current' : ''}`} />
                      Helpful ({review.helpful_votes})
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}