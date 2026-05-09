"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavProps = {
  username?: string | null;
  signOutAction?: () => Promise<void>;
};

export function Nav({ username, signOutAction }: NavProps) {
  const pathname = usePathname();
  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-8">
        <Link href="/pensions" className="font-semibold text-gray-900">
          Pension Tracker
        </Link>
        <nav className="flex gap-6">
          <Link
            href="/pensions"
            className={`text-sm transition-colors ${
              pathname.startsWith("/pensions")
                ? "font-medium text-gray-900"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Pensions
          </Link>
          <Link
            href="/settings"
            className={`text-sm transition-colors ${
              pathname.startsWith("/settings")
                ? "font-medium text-gray-900"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Settings
          </Link>
        </nav>

        {username && signOutAction && (
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-gray-500">{username}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
