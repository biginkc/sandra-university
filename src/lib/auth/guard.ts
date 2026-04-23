import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ProfileRole = "owner" | "admin" | "learner";

export type AuthedProfile = {
  id: string;
  email: string;
  full_name: string;
  system_role: ProfileRole;
};

export async function getAuthedProfile(): Promise<AuthedProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, system_role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return profile as AuthedProfile;
}

export async function requireAdmin(): Promise<AuthedProfile> {
  const profile = await getAuthedProfile();
  if (!profile) redirect("/login");
  if (profile.system_role !== "owner" && profile.system_role !== "admin") {
    redirect("/dashboard");
  }
  return profile;
}
