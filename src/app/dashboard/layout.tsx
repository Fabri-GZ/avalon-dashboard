import { redirect } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/server';
import { Role, DashboardContext, defaultRouteForRole, KNOWN_ROLES } from '@/lib/permissions';
import { SectionKey } from '@/lib/sections';
import DashboardShell from './DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, client_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/login?error=no_profile');
  }

  const role = profile.role as Role;

  if (!KNOWN_ROLES.includes(role)) {
    redirect('/login?error=unknown_role');
  }

  const { data: perms } = await supabase
    .from('section_permissions')
    .select('section_key')
    .eq('role', role);

  const allowedSections: SectionKey[] = (perms ?? []).map(
    (p: { section_key: string }) => p.section_key as SectionKey
  );

  if (allowedSections.length === 0) {
    redirect('/dashboard/settings');
  }

  return (
    <DashboardShell
      initialRole={role}
      initialAllowedSections={allowedSections}
      initialUserId={user.id}
    >
      {children}
    </DashboardShell>
  );
}
