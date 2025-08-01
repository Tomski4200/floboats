import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import ProtectedPage from '@/components/auth/ProtectedPage';

interface Member {
  user_id: string;
  role: string;
  profiles: {
    username: string;
    avatar_url: string;
  }[] | null;
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function GroupMembersPage({ params }: PageProps) {
  const { id } = await params;
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

  const { data: group, error: groupError } = await supabase
    .from('business_groups')
    .select('name')
    .eq('id', id)
    .single();

  if (groupError || !group) {
    notFound();
  }

  const { data: members, error: membersError } = await supabase
    .from('user_business_permissions')
    .select('user_id, role, profiles(username, avatar_url)')
    .eq('group_id', id);

  if (membersError) {
    console.error('Error fetching members:', membersError);
  }

  return (
    <ProtectedPage>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Members of {group.name}</h1>
        <div className="mt-6 bg-white shadow rounded-lg">
          <ul className="divide-y divide-gray-200">
            {members && members.length > 0 ? (
              members.map((member: Member) => (
                <li key={member.user_id} className="p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <img src={member.profiles?.[0]?.avatar_url || '/default-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full" />
                    <span className="ml-4 font-medium">{member.profiles?.[0]?.username}</span>
                  </div>
                  <span className="text-sm text-gray-500">{member.role}</span>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-gray-500">
                No members found.
              </li>
            )}
          </ul>
        </div>
        <div className="mt-6">
          <h2 className="text-lg font-bold">Invite New Member</h2>
          {/* TODO: Create a proper form component */}
          <form className="mt-4 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="email" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
              <select id="role" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Invite</button>
          </form>
        </div>
      </div>
    </ProtectedPage>
  );
}
