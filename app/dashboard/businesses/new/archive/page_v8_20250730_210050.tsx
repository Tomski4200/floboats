'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import ProtectedPage from '@/components/auth/ProtectedPage'

interface Category {
  id: string;
  name: string;
}

export default function NewBusinessPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  
  const [formData, setFormData] = useState({
    business_name: '',
    category_ids: [] as string[],
    description: '',
    phone: '',
    email: '',
    website_url: '',
    address_line1: '',
    city: '',
    state: '',
    zip_code: '',
  })

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: categoriesData } = await supabase.from('business_categories').select('id, name');
      if (categoriesData) setCategories(categoriesData);
    }
    fetchInitialData();
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: business, error: insertError } = await supabase
        .from('businesses')
        .insert({
          business_name: formData.business_name,
          description: formData.description,
          phone: formData.phone,
          email: formData.email,
          website_url: formData.website_url,
          address_line1: formData.address_line1,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          claimed_by: user.id,
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return
      }

      if (business && formData.category_ids.length > 0) {
        const links = formData.category_ids.map(categoryId => ({
          business_id: business.id,
          category_id: categoryId,
        }))
        const { error: linkError } = await supabase.from('business_to_category_links').insert(links)
        if (linkError) {
          setError(linkError.message)
          // TODO: Handle potential rollback
          return
        }
      }

      router.push(`/businesses/${business.slug}`)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedPage>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Business</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 shadow rounded-lg">
          {error && <p className="text-red-500">{error}</p>}
          
        <Label htmlFor="business_name">Business Name</Label>
        <Input id="business_name" name="business_name" value={formData.business_name} onChange={handleChange} required />

        <Label>Categories</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map(category => (
              <label key={category.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.category_ids.includes(category.id)}
                  onChange={() => handleCategoryChange(category.id)}
                />
                <span>{category.name}</span>
              </label>
            ))}
          </div>

          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />

          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />

          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />

          <Label htmlFor="website_url">Website</Label>
          <Input id="website_url" name="website_url" type="url" value={formData.website_url} onChange={handleChange} />

          <Label htmlFor="address_line1">Address</Label>
          <Input id="address_line1" name="address_line1" value={formData.address_line1} onChange={handleChange} />

          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" value={formData.city} onChange={handleChange} />

          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" value={formData.state} onChange={handleChange} />

          <Label htmlFor="zip_code">Zip Code</Label>
          <Input id="zip_code" name="zip_code" value={formData.zip_code} onChange={handleChange} />

          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Business'}
          </Button>
        </form>
      </div>
    </ProtectedPage>
  )
}
