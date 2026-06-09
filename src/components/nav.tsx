"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

type NavProps = {
  username?: string | null;
  signOutAction?: () => Promise<void>;
};

export function Nav({ username, signOutAction }: NavProps) {
  const pathname = usePathname();
  return (
    <header className="border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-8">
        <Link href="/pensions" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-50">
          <Image src="/logo-mark.svg" alt="" width={28} height={28} priority />
          Pension Tracker
        </Link>
        <nav className="flex gap-6">
          <Link
            href="/pensions"
            className={`text-sm transition-colors ${
              pathname.startsWith("/pensions")
                ? "font-medium text-gray-900 dark:text-gray-50"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            }`}
          >
            Pensions
          </Link>
          <Link
            href="/settings"
            className={`text-sm transition-colors ${
              pathname.startsWith("/settings")
                ? "font-medium text-gray-900 dark:text-gray-50"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            }`}
          >
            Settings
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle />
          {username && signOutAction && (
            <>
              <span className="text-sm text-gray-500 dark:text-gray-400">{username}</span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
