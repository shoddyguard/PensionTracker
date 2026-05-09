import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SetupForm } from "@/components/auth/setup-form";

export default async function SetupPage() {
  const [existing] = await db.select({ id: users.id }).from(users).limit(1);
  if (existing) redirect("/login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Pension Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">Create your account to get started</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
