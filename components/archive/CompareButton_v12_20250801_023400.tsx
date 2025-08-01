'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CompareButtonProps {
  boatId: string
  className?: string
  showText?: boolean
}

export default function CompareButton({ boatId, className = '', showText = true }: CompareButtonProps) {
  const [compareList, setCompareList] = useState<string[]>([])
  const [isInCompare, setIsInCompare] = useState(false)

  useEffect(() => {
    // Load compare list from localStorage
    const saved = localStorage.getItem('floboats_compare_list')
    if (saved) {
      const list = JSON.parse(saved)
      setCompareList(list)
      setIsInCompare(list.includes(boatId))
    }
  }, [boatId])

  const toggleCompare = () => {
    let newList: string[]
    
    if (isInCompare) {
      // Remove from compare list
      newList = compareList.filter(id => id !== boatId)
    } else {
      // Add to compare list
      if (compareList.length >= 4) {
        alert('You can compare up to 4 boats at a time')
        return
      }
      newList = [...compareList, boatId]
    }

    // Save to localStorage
    localStorage.setItem('floboats_compare_list', JSON.stringify(newList))
    setCompareList(newList)
    setIsInCompare(!isInCompare)
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={toggleCompare}
        className={`flex items-center ${showText ? 'px-4 py-2' : 'p-2'} rounded-lg font-medium transition-colors ${
          isInCompare
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } ${className}`}
        title={isInCompare ? 'Remove from comparison' : 'Add to comparison'}
      >
        <svg
          className={`w-5 h-5 ${showText ? 'mr-2' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        {showText && (isInCompare ? 'In Compare' : 'Compare')}
      </button>
      
      {compareList.length > 0 && showText && (
        <Link
          href={`/compare?ids=${compareList.join(',')}`}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Comparison ({compareList.length})
        </Link>
      )}
    </div>
  )
}