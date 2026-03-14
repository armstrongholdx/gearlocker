import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { buildActionFailurePath, buildActionSuccessPath, readFeedback } from "@/lib/action-feedback";
import { createWorkspaceRecord, getWorkspaceContext } from "@/lib/workspace";

export const dynamic = "force-dynamic";

async function createWorkspace(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  try {
    await createWorkspaceRecord({ name, description });
    redirect(buildActionSuccessPath("/manage/workspace", "Workspace created."));
  } catch (error) {
    redirect(buildActionFailurePath("/manage/workspace", error));
  }
}

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [workspaceContext, feedback] = await Promise.all([getWorkspaceContext(), readFeedback(searchParams)]);

  return (
    <div className="space-y-6">
      <FeedbackBanner {...feedback} />
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workspace</div>
        <h1 className="text-3xl font-semibold tracking-tight">Workspace and membership foundations</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current workspace state</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!workspaceContext.workspaceSupportReady ? (
              <div className="rounded-[1.1rem] border border-dashed border-slate-300 bg-secondary/50 p-4 text-sm text-muted-foreground">
                Workspace tables are scaffolded in code, but the database migration may not be applied yet.
              </div>
            ) : workspaceContext.workspaces.length === 0 ? (
              <div className="rounded-[1.1rem] border border-dashed border-slate-300 bg-secondary/50 p-4 text-sm text-muted-foreground">
                No workspace records yet. Create the first workspace to move from solo legacy mode toward true multi-user structure.
              </div>
            ) : (
              workspaceContext.workspaces.map((workspace) => (
                <div key={workspace.id} className="rounded-[1.15rem] border border-slate-200 bg-white/75 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{workspace.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {workspace._count.items} items · {workspace._count.kits} kits · {workspace._count.locations} locations
                      </div>
                    </div>
                    <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                      {workspace.slug}
                    </div>
                  </div>
                  {workspace.description ? <div className="mt-3 text-sm text-muted-foreground">{workspace.description}</div> : null}
                  <div className="mt-3 text-sm text-muted-foreground">
                    Members: {workspace.memberships.length}
                    {workspace.owner?.email ? ` · Owner ${workspace.owner.email}` : ""}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-slate-950 text-white">
            <CardHeader>
              <CardTitle className="text-white">Auth and access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <div>Current auth session: {workspaceContext.authUser?.email ?? "signed out"}</div>
              <div>Workspaces are modeled as the owner/account boundary. Data should eventually scope to workspace, not just user.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create workspace</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createWorkspace} className="space-y-3">
                <Field label="Workspace name">
                  <input name="name" required className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm" placeholder="Armstrong Camera Dept" />
                </Field>
                <Field label="Description">
                  <textarea name="description" className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm" placeholder="Solo owner-op inventory or team workspace." />
                </Field>
                <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-medium text-white">
                  Create workspace
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
