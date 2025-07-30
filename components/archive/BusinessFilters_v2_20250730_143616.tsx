'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createBrowserClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: string
  parent_category_id: string | null
}

export default function BusinessFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [cities, setCities] = useState<string[]>([])
  
  const currentCategory = searchParams.get('category') || 'all'
  const currentCity = searchParams.get('city') || 'all'
  const currentSort = searchParams.get('sort') || 'featured'
  
  useEffect(() => {
    loadFilterData()
  }, [])
  
  async function loadFilterData() {
    const supabase = createBrowserClient()
    
    // Load categories
    const { data: categoriesData } = await supabase
      .from('business_categories')
      .select('id, name, parent_category_id')
      .eq('is_active', true)
      .order('order_index')
    
    if (categoriesData) {
      setCategories(categoriesData)
    }
    
    // Load unique cities
    const { data: citiesData } = await supabase
      .from('businesses')
      .select('city')
      .eq('business_status', 'active')
      .eq('listing_status', 'published')
      .order('city')
    
    if (citiesData) {
      const uniqueCities = [...new Set(citiesData.map(b => b.city))].filter(Boolean)
      setCities(uniqueCities)
    }
  }
  
  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    
    router.push(`/businesses?${params.toString()}`)
  }
  
  function clearFilters() {
    router.push('/businesses')
  }
  
  const mainCategories = categories.filter(c => !c.parent_category_id)
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={currentCategory}
            onValueChange={(value) => updateFilter('category', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="cat-all" />
              <Label htmlFor="cat-all">All Categories</Label>
            </div>
            
            {mainCategories.map((category) => (
              <div key={category.id}>
                <div className="flex items-center space-x-2 mt-2">
                  <RadioGroupItem value={category.id} id={`cat-${category.id}`} />
                  <Label htmlFor={`cat-${category.id}`} className="font-medium">
                    {category.name}
                  </Label>
                </div>
                
                {categories
                  .filter(c => c.parent_category_id === category.id)
                  .map((subCategory) => (
                    <div key={subCategory.id} className="flex items-center space-x-2 ml-6 mt-1">
                      <RadioGroupItem value={subCategory.id} id={`cat-${subCategory.id}`} />
                      <Label htmlFor={`cat-${subCategory.id}`} className="text-sm">
                        {subCategory.name}
                      </Label>
                    </div>
                  ))}
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Select value={currentCity} onValueChange={(value) => updateFilter('city', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="location">Your Location</Label>
            <Input id="location" placeholder="e.g., Miami, FL or 33101" />
          </div>
          <div>
            <Label htmlFor="radius">Radius</Label>
            <Select onValueChange={(value) => updateFilter('radius', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a radius" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="10">10 miles</SelectItem>
                <SelectItem value="25">25 miles</SelectItem>
                <SelectItem value="50">50 miles</SelectItem>
                <SelectItem value="100">100 miles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Sort By</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={currentSort}
            onValueChange={(value) => updateFilter('sort', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="featured" id="sort-featured" />
              <Label htmlFor="sort-featured">Featured</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rating" id="sort-rating" />
              <Label htmlFor="sort-rating">Highest Rated</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="reviews" id="sort-reviews" />
              <Label htmlFor="sort-reviews">Most Reviews</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="newest" id="sort-newest" />
              <Label htmlFor="sort-newest">Newest</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      <Button 
        variant="outline" 
        className="w-full"
        onClick={clearFilters}
      >
        Clear All Filters
      </Button>
    </div>
  )
}
