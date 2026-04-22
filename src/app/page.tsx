import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-balance text-zinc-50 sm:text-5xl">
        Train with clarity. Progress with data.
      </h1>
      <p className="mt-6 text-lg text-zinc-400">
        Log sessions, see progressive-overload targets, track recovery, chart strength over time, and
        generate structured workout or run plans from natural language prompts. Your training log is
        private; this site is on the public web.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500/90 px-5 py-2.5 text-sm font-medium text-zinc-950 shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400"
        >
          Create account
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-600 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
