'use client'

import { useState, useRef } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  bucket?: string
  maxSizeMB?: number
  acceptedTypes?: string[]
}

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const DEFAULT_MAX_SIZE_MB = 2

export default function ImageUpload({
  value,
  onChange,
  bucket = 'event-photos',
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Reset states
    setError(null)
    setUploadProgress(0)
    
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError(`Invalid file type. Accepted types: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}`)
      return
    }
    
    // Validate file size
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit`)
      return
    }
    
    try {
      setUploading(true)
      const supabase = createBrowserClient()
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `events/${fileName}`
      
      // Upload file with progress tracking
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        throw uploadError
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
      
      onChange(publicUrl)
      setUploadProgress(100)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  async function handleRemove() {
    if (!value) return
    
    try {
      // Extract file path from URL
      const url = new URL(value)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.findIndex(part => part === bucket)
      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/')
        
        const supabase = createBrowserClient()
        await supabase.storage
          .from(bucket)
          .remove([filePath])
      }
    } catch (err) {
      console.error('Failed to remove file:', err)
    }
    
    onChange('')
    setError(null)
    setUploadProgress(0)
  }
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Uploaded image"
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Choose Image'}
          </Button>
          
          <p className="mt-2 text-sm text-gray-500">
            or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} up to {maxSizeMB}MB
          </p>
        </div>
      )}
      
      {uploading && (
        <Progress value={uploadProgress} className="w-full" />
      )}
    </div>
  )
}