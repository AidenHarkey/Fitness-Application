"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, FormEvent, Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callback = searchParams.get("callbackUrl") || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl: callback });
    setPending(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    if (res?.ok) {
      router.push(res.url || callback);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-4 max-w-sm space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
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
        <label className="block text-xs text-zinc-500">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100"
          required
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-emerald-500/90 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-zinc-500">
        No account?{" "}
        <Link className="text-emerald-400" href="/register">
          Register
        </Link>
      </p>
    </div>
  );
}
