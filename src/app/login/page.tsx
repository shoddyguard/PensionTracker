import { redirect } from "next/navigation";
import Image from "next/image";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn, azureEnabled } from "@/auth";
import { CredentialsForm } from "@/components/auth/credentials-form";

export default async function LoginPage() {
  const [existing] = await db.select({ id: users.id }).from(users).limit(1);
  if (!existing) redirect("/setup");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo-mark.svg" alt="Pension Tracker" width={56} height={56} priority />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Pension Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
          <CredentialsForm />

          {azureEnabled && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 px-2">
                  or
                </div>
              </div>

              <form
                action={async () => {
                  "use server";
                  await signIn("microsoft-entra-id", { redirectTo: "/pensions" });
                }}
              >
                <button
                  type="submit"
                  className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                  </svg>
                  Sign in with Microsoft
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
