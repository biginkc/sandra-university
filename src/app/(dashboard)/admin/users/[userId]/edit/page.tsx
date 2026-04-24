import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/guard";

import { UserEditForm, type RoleGroupOption } from "./user-edit-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const me = await getAuthedProfile();
  if (!me) notFound();

  const supabase = await createClient();
  const [profileRes, roleGroupsRes, userRoleGroupsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, system_role, status, created_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("role_groups").select("id, name").order("name"),
    supabase
      .from("user_role_groups")
      .select("role_group_id")
      .eq("user_id", userId),
  ]);

  const profile = profileRes.data as
    | {
        id: string;
        email: string;
        full_name: string;
        system_role: "owner" | "admin" | "learner";
        status: "active" | "invited" | "suspended";
        created_at: string;
      }
    | null;
  if (!profile) notFound();

  const allRoleGroups = (roleGroupsRes.data ?? []) as RoleGroupOption[];
  const currentRoleGroupIds = (userRoleGroupsRes.data ?? []).map(
    (r) => r.role_group_id as string,
  );

  const isEditingSelf = me.id === profile.id;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6 md:p-10">
      <Link
        href="/admin/users"
        className="text-muted-foreground hover:text-foreground text-xs"
      >
        ← Back to users
      </Link>

      <div className="mt-3 mb-8">
        <h1 className="text-2xl font-semibold">{profile.full_name}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{profile.email}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {profile.system_role}
          </Badge>
          <Badge
            variant={profile.status === "active" ? "default" : "secondary"}
            className="capitalize"
          >
            {profile.status}
          </Badge>
          <span className="text-muted-foreground text-xs">
            · joined {new Date(profile.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Role, status, and role-group membership. Changes save together.
            Adding a role group that unlocks new programs fires an enrollment
            email to the user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserEditForm
            userId={profile.id}
            initialSystemRole={profile.system_role}
            initialStatus={profile.status}
            initialRoleGroupIds={currentRoleGroupIds}
            allRoleGroups={allRoleGroups}
            canModifyRole={!isEditingSelf}
            canSuspend={!isEditingSelf}
          />
        </CardContent>
      </Card>
    </main>
  );
}
