'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface Photo {
  id: string
  photo_url: string
  caption: string
  photo_type: string
  order_index: number
}

interface BusinessGalleryProps {
  photos: Photo[]
  businessName: string
}

export default function BusinessGallery({ photos, businessName }: BusinessGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const sortedPhotos = [...photos].sort((a, b) => a.order_index - b.order_index)
  const currentPhoto = sortedPhotos[selectedIndex]
  
  function handlePrevious() {
    setSelectedIndex((prev) => (prev === 0 ? sortedPhotos.length - 1 : prev - 1))
  }
  
  function handleNext() {
    setSelectedIndex((prev) => (prev === sortedPhotos.length - 1 ? 0 : prev + 1))
  }
  
  if (sortedPhotos.length === 0) return null
  
  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
          <img
            src={currentPhoto.photo_url}
            alt={currentPhoto.caption || businessName}
            className="h-full w-full object-cover cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          />
          
          {sortedPhotos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {currentPhoto.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3">
              <p className="text-sm">{currentPhoto.caption}</p>
            </div>
          )}
        </div>
        
        {/* Thumbnails */}
        {sortedPhotos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sortedPhotos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setSelectedIndex(index)}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md ${
                  index === selectedIndex ? 'ring-2 ring-primary' : ''
                }`}
              >
                <img
                  src={photo.photo_url}
                  alt={photo.caption || `${businessName} photo ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Full-size Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <img
              src={currentPhoto.photo_url}
              alt={currentPhoto.caption || businessName}
              className="h-full w-full"
            />
            
            {sortedPhotos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {currentPhoto.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4">
                <p>{currentPhoto.caption}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
