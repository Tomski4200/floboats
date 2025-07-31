import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import ProtectedPage from '@/components/auth/ProtectedPage';

export default async function BusinessGroupPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: group, error } = await supabase
    .from('business_groups')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !group) {
    notFound();
  }

  return (
    <ProtectedPage>
      <div className="p-6">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="text-gray-500 mt-2">{group.description}</p>
        {group.website_url && (
          <a href={group.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mt-2 block">
            {group.website_url}
          </a>
        )}
        {/* TODO: Add business list, member management, and settings */}
      </div>
    </ProtectedPage>
  );
}
