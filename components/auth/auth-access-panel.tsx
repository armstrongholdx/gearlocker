"use client";

import { useState, useTransition } from "react";
import { LogIn, LogOut, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthAccessPanel({
  initialEmail,
}: {
  initialEmail?: string | null;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const supabase = createSupabaseBrowserClient();

  async function signInWithMagicLink() {
    if (!supabase || !email.trim()) {
      setMessage("Supabase Auth is not configured or email is empty.");
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      setMessage(error ? error.message : "Magic link sent. Check your email.");
    });
  }

  async function signOut() {
    if (!supabase) {
      setMessage("Supabase Auth is not configured.");
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.signOut();
      setMessage(error ? error.message : "Signed out.");
      if (!error) {
        window.location.reload();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.2rem] border border-slate-200 bg-white/80 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Auth foundation
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Use magic-link sign-in as the first step toward real multi-user workspace access.
        </div>
      </div>

      <div className="space-y-3 rounded-[1.2rem] border border-slate-200 bg-white/80 p-4">
        <label className="space-y-2 text-sm font-medium">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm"
            placeholder="name@example.com"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={signInWithMagicLink} disabled={isPending}>
            <LogIn className="h-4 w-4" />
            Send magic link
          </Button>
          <Button type="button" variant="outline" onClick={signOut} disabled={isPending}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
        {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}
      </div>
    </div>
  );
}
