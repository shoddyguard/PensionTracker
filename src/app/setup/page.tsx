import { redirect } from "next/navigation";
import Image from "next/image";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SetupForm } from "@/components/auth/setup-form";

export default async function SetupPage() {
  const [existing] = await db.select({ id: users.id }).from(users).limit(1);
  if (existing) redirect("/login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo-mark.svg" alt="Pension Tracker" width={56} height={56} priority />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Pension Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your account to get started</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
