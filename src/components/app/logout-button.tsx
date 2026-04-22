"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={className || "w-full rounded-md border border-white/10 px-3 py-2 text-left text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"}
    >
      Sign out
    </button>
  );
}
