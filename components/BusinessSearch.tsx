'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function BusinessSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  
  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    
    const params = new URLSearchParams(searchParams.toString())
    
    if (searchTerm) {
      params.set('search', searchTerm)
    } else {
      params.delete('search')
    }
    
    router.push(`/businesses?${params.toString()}`)
  }
  
  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search businesses by name or description..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button type="submit">Search</Button>
    </form>
  )
}
