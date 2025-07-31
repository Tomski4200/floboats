'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import ProtectedPage from '@/components/auth/ProtectedPage'
import Link from 'next/link'

interface Business {
  id: string;
  business_name: string;
  address_line1: string;
  city: string;
  state: string;
}

export default function ClaimBusinessPage() {
  const supabase = createBrowserClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setSearchResults([])

    const { data, error } = await supabase
      .from('businesses')
      .select('id, business_name, address_line1, city, state')
      .or(`business_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .limit(10)

    if (error) {
      setMessage('Error searching for businesses.')
    } else if (data.length === 0) {
      setMessage('No businesses found. You can create a new listing.')
    } else {
      setSearchResults(data)
    }
    setLoading(false)
  }

  const handleClaim = async (businessId: string) => {
    // TODO: Implement the actual claim process
    alert(`Claiming business ${businessId}. This feature is not yet implemented.`)
  }

  return (
    <ProtectedPage>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Claim Your Business</h1>
        <p className="mb-6 text-gray-600">
          Search for your business by name or phone number to claim your profile.
        </p>
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <Input
            type="text"
            placeholder="Enter business name or phone number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {message && <p className="text-center">{message}</p>}

        <div className="space-y-4">
          {searchResults.map(business => (
            <div key={business.id} className="p-4 border rounded-lg flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{business.business_name}</h3>
                <p className="text-sm text-gray-500">
                  {business.address_line1}, {business.city}, {business.state}
                </p>
              </div>
              <Button onClick={() => handleClaim(business.id)}>Claim</Button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p>Can't find your business?</p>
          <Link href="/dashboard/businesses/new" className="text-blue-500 hover:underline">
            Create a new business listing
          </Link>
        </div>
      </div>
    </ProtectedPage>
  )
}
