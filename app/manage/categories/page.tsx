import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { buildActionFailurePath, buildActionSuccessPath, readFeedback } from "@/lib/action-feedback";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext } from "@/lib/workspace";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function createCategory(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const prefix = String(formData.get("prefix") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  try {
    const workspace = await getWorkspaceContext();

    await prisma.category.create({
      data: {
        name,
        prefix,
        description,
        slug: slugify(name),
        workspaceId: workspace.currentWorkspace?.id ?? null,
      },
    });

    redirect(buildActionSuccessPath("/manage/categories", "Category created."));
  } catch (error) {
    redirect(buildActionFailurePath("/manage/categories", error));
  }
}

export default async function ManageCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [categories, feedback] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    readFeedback(searchParams),
  ]);

  return (
    <div className="space-y-6">
      <FeedbackBanner {...feedback} />
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Manage categories</div>
        <h1 className="text-3xl font-semibold tracking-tight">Category structure and asset prefixes</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="rounded-[1.1rem] border border-slate-200 bg-white/75 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{category.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Prefix {category.prefix} · {category._count.items} items
                    </div>
                  </div>
                  <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                    {category.slug}
                  </div>
                </div>
                {category.description ? <div className="mt-3 text-sm text-muted-foreground">{category.description}</div> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create category</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCategory} className="space-y-3">
              <Field label="Name">
                <input name="name" required className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm" placeholder="Camera" />
              </Field>
              <Field label="Prefix">
                <input name="prefix" required className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm uppercase" placeholder="CAM" />
              </Field>
              <Field label="Description">
                <textarea name="description" className="min-h-24 w-full rounded-xl border bg-background px-3 py-2 text-sm" placeholder="Broad category used for browse, filtering, and asset-ID structure." />
              </Field>
              <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-medium text-white">
                Create category
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
