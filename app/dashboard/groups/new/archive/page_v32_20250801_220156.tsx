'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ProtectedPage from '@/components/auth/ProtectedPage';

export default function NewBusinessGroupPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to create a group.');
      setIsSubmitting(false);
      return;
    }

    const { data: group, error: insertError } = await supabase
      .from('business_groups')
      .insert({
        name,
        description,
        website_url: websiteUrl,
        logo_url: logoUrl,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsSubmitting(false);
      return;
    }

    if (group) {
      // Assign the creator as the owner
      const { error: permissionError } = await supabase
        .from('user_business_permissions')
        .insert({
          user_id: user.id,
          group_id: group.id,
          role: 'owner',
        });

      if (permissionError) {
        setError(permissionError.message);
        setIsSubmitting(false);
        return;
      }
    }

    router.push('/dashboard/groups');
  };

  return (
    <ProtectedPage>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Business Group</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 shadow rounded-lg">
          <div>
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              value={websiteUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebsiteUrl(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogoUrl(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </Button>
        </form>
      </div>
    </ProtectedPage>
  );
}
