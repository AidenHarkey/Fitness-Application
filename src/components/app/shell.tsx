import Link from "next/link";
import { LogoutButton } from "./logout-button";

const nav = [
  { href: "/app", label: "Home" },
  { href: "/app/log", label: "Log workout" },
  { href: "/app/progress", label: "Progress" },
  { href: "/app/plans", label: "Plans" },
  { href: "/app/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-black/20 p-6 md:block">
        <Link href="/app" className="text-lg font-semibold tracking-tight text-emerald-400">
          Lift &amp; Pace
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-10">
          <LogoutButton />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="border-b border-white/10 bg-black/10 px-4 py-3 md:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded bg-white/5 px-2 py-1 text-xs text-zinc-200"
              >
                {item.label}
              </Link>
            ))}
            <LogoutButton className="text-xs" />
          </div>
        </header>
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
