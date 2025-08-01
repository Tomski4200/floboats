import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import ProtectedPage from '@/components/auth/ProtectedPage';

interface BusinessGroup {
  id: string;
  name: string;
  description: string | null;
}

export default async function BusinessGroupsPage() {
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

  const { data: groups, error } = await supabase
    .from('business_groups')
    .select('*');

  if (error) {
    console.error('Error fetching business groups:', error);
  }

  return (
    <ProtectedPage>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Business Groups</h1>
          <Link href="/dashboard/groups/new">
            <Button>Create New Group</Button>
          </Link>
        </div>
        <div className="bg-white shadow rounded-lg">
          <ul className="divide-y divide-gray-200">
            {groups && groups.length > 0 ? (
              groups.map((group: BusinessGroup) => (
                <li key={group.id} className="p-4 hover:bg-gray-50">
                  <Link href={`/dashboard/groups/${group.id}`}>
                    <div className="font-medium text-gray-900">{group.name}</div>
                    <div className="text-sm text-gray-500">{group.description}</div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-gray-500">
                No business groups found.
              </li>
            )}
          </ul>
        </div>
      </div>
    </ProtectedPage>
  );
}
