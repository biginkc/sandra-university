import { requireAdmin } from "@/lib/auth/guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  // Admin nav now lives in the parent DashboardLayout sidebar.
  return <>{children}</>;
}
