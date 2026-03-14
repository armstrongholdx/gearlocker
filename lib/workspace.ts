import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const WORKSPACE_COOKIE = "gear-locker-workspace";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getCurrentAuthUser() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getWorkspaceContext() {
  const [authUser, cookieStore] = await Promise.all([getCurrentAuthUser(), cookies()]);
  const selectedWorkspaceId = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;

  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        owner: true,
        memberships: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            items: true,
            kits: true,
            locations: true,
          },
        },
      },
    });

    const currentWorkspace =
      workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ??
      workspaces[0] ??
      null;

    return {
      authUser,
      workspaces,
      currentWorkspace,
      workspaceSupportReady: true,
    };
  } catch {
    return {
      authUser,
      workspaces: [],
      currentWorkspace: null,
      workspaceSupportReady: false,
    };
  }
}

export async function createWorkspaceRecord({
  name,
  description,
}: {
  name: string;
  description?: string | null;
}) {
  const authUser = await getCurrentAuthUser();

  const appUser =
    authUser
      ? await prisma.appUser.upsert({
          where: { supabaseUserId: authUser.id },
          update: {
            email: authUser.email ?? null,
            displayName: authUser.user_metadata?.full_name ?? authUser.email ?? null,
          },
          create: {
            supabaseUserId: authUser.id,
            email: authUser.email ?? null,
            displayName: authUser.user_metadata?.full_name ?? authUser.email ?? null,
          },
        })
      : null;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug: slugify(name),
      description: description || null,
      ownerId: appUser?.id ?? null,
      ...(appUser
        ? {
            memberships: {
              create: {
                userId: appUser.id,
                role: "owner",
              },
            },
          }
        : {}),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspace.id, { path: "/" });

  return workspace;
}
