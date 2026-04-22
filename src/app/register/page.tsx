"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });
    setPending(false);
    const data = await r.json();
    if (!r.ok) {
      setError(data.error || "Could not register.");
      return;
    }
    const sign = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl: "/app",
    });
    if (sign?.ok) {
      router.push("/app");
      router.refresh();
    } else if (sign?.error === "Configuration") {
      setError("Account was created, but sign-in is misconfigured. In Vercel, add AUTH_SECRET under Environment Variables (Production), then Redeploy, then use Sign in.");
    } else {
      setError("Account created. Please sign in manually.");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form onSubmit={onSubmit} className="mx-auto mt-4 w-full max-w-sm space-y-4">
        {error && <p className="text-sm text-amber-400/90">{error}</p>}
        <div>
          <label className="block text-xs text-zinc-500">Name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500">Password (min 8 characters)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100"
            minLength={8}
            required
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-emerald-500/90 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Register"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link className="text-emerald-400" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
