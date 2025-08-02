'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function BusinessOwnerCta() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) {
    return null
  }

  return (
    <div className="my-8 p-6 bg-blue-50 rounded-lg relative">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 p-1 text-blue-600 hover:bg-blue-100 rounded-full"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>
      <h2 className="text-2xl font-bold text-blue-800">For Business Owners</h2>
      <p className="mt-2 text-blue-700">
        Is your business listed? Claim your profile to manage your page, respond to reviews, and more.
      </p>
      <div className="mt-4 flex gap-4">
        <Link href="/directory/claim">
          <Button>Claim Your Business</Button>
        </Link>
        <Link href="/dashboard/businesses/new">
          <Button variant="outline">Create a New Listing</Button>
        </Link>
      </div>
    </div>
  )
}
