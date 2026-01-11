import { DashboardLayout } from '@/components/layout';

/**
 * Dashboard Layout
 *
 * Wraps all dashboard routes with the main layout (header, sidebar).
 * Authentication is handled by Clerk middleware.
 */

// Force dynamic rendering for all dashboard routes (they use Convex/Clerk)
export const dynamic = 'force-dynamic';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
