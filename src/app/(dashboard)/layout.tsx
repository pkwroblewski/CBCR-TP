import { DashboardLayout } from '@/components/layout';
import { DEV_USER, isDevAuthBypass } from '@/lib/auth/dev-user';

/**
 * Dashboard Layout
 *
 * Wraps all dashboard routes with the main layout (header, sidebar).
 */
export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use dev user when auth bypass is enabled, otherwise get from Supabase
  // TODO: Replace demo user with actual Supabase auth user
  const user = isDevAuthBypass()
    ? DEV_USER
    : {
        name: 'Demo User',
        email: 'demo@example.com',
        initials: 'DU',
      };

  return (
    <DashboardLayout user={user}>
      {children}
    </DashboardLayout>
  );
}

