"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PensionSubNav({ pensionId }: { pensionId: number }) {
  const pathname = usePathname();
  const base = `/pensions/${pensionId}`;

  const links = [
    { href: base, label: "Overview" },
    { href: `${base}/funds`, label: "Funds" },
    { href: `${base}/snapshots`, label: "Snapshots" },
    { href: `${base}/settings`, label: "Settings" },
  ];

  return (
    <nav className="flex gap-6">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`text-sm transition-colors ${
            pathname === link.href ||
            (link.href !== base && pathname.startsWith(link.href))
              ? "font-medium text-gray-900"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
