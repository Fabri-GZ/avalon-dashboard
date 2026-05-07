import { redirect } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/server';
import { defaultRouteForRole } from '@/lib/permissions';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role ?? 'client_user';
  redirect(defaultRouteForRole(role));
}
