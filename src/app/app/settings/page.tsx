import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  const u = session!.user!;
  let s = await prisma.userSettings.findUnique({ where: { userId: u.id } });
  if (!s) s = await prisma.userSettings.create({ data: { userId: u.id } });

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Rest between sets, recovery day threshold, and weight unit.</p>
      </div>
      <p className="text-sm text-zinc-500">
        Signed in as <span className="text-zinc-300">{u.email}</span>
      </p>
      <SettingsForm
        initial={{
          defaultRestSeconds: s.defaultRestSeconds,
          recoveryMinDays: s.recoveryMinDays,
          weightUnit: s.weightUnit,
        }}
      />
    </div>
  );
}
