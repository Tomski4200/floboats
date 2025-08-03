'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useDebounce } from '@/hooks/use-debounce'

export default function BusinessSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [isSearching, setIsSearching] = useState(false)
  
  // Debounce the search term to avoid too many updates
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  // Update URL when debounced search term changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (debouncedSearchTerm) {
      params.set('search', debouncedSearchTerm)
    } else {
      params.delete('search')
    }
    
    // Only push if the URL actually changed
    const newUrl = `/directory?${params.toString()}`
    const currentUrl = `${window.location.pathname}${window.location.search}`
    
    if (newUrl !== currentUrl) {
      router.push(newUrl)
      setIsSearching(false)
    }
  }, [debouncedSearchTerm, searchParams, router])
  
  // Show loading state while user is typing
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true)
    }
  }, [searchTerm, debouncedSearchTerm])
  
  const handleClear = () => {
    setSearchTerm('')
    setIsSearching(false)
  }
  
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search businesses instantly..."
        value={searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        className="pl-10 pr-20"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {isSearching && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
