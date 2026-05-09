import { auth } from "@/auth";
import { ClearDatabaseButton } from "@/components/settings/clear-database-button";
import { ChangePasswordForm } from "@/components/settings/change-password-form";

export default async function SettingsPage() {
  const session = await auth();
  const isCredentialsUser = session?.user?.provider === "credentials";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {isCredentialsUser && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Change Password</h2>
          <ChangePasswordForm />
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-red-700 mb-1">Danger Zone</h2>
          <p className="text-sm text-gray-500 mb-4">
            Irreversible actions. Please be certain before proceeding.
          </p>
        </div>
        <div className="border border-red-200 rounded-lg p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Clear all data</p>
            <p className="text-sm text-gray-500">
              Remove all pensions, funds, snapshots, and contributions from the database.
            </p>
          </div>
          <ClearDatabaseButton />
        </div>
      </div>
    </div>
  );
}
