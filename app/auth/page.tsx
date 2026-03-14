import { AuthAccessPanel } from "@/components/auth/auth-access-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAuthUser } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const user = await getCurrentAuthUser();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Access</div>
        <h1 className="text-3xl font-semibold tracking-tight">Auth and workspace access</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <AuthAccessPanel initialEmail={user?.email ?? ""} />

        <Card>
          <CardHeader>
            <CardDescription>Current session</CardDescription>
            <CardTitle>{user?.email ?? "Signed out"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>Supabase Auth is now scaffolded for magic-link sign-in and future protected workspace access.</div>
            <div>The app is not fully locked down to workspaces yet, but the authentication path is now in place.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
