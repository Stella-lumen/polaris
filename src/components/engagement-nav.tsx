"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function EngagementNav({
  base,
  tabs,
}: {
  base: string;
  tabs: { slug: string; label: string }[];
}) {
  const pathname = usePathname();

  const isActive = (slug: string) => {
    const href = slug ? `${base}/${slug}` : base;
    if (!slug) return pathname === base;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="flex border-b text-sm">
      {tabs.map((t) => {
        const active = isActive(t.slug);
        return (
          <Link
            key={t.slug}
            href={t.slug ? `${base}/${t.slug}` : base}
            className={`-mb-px border-b-2 px-4 py-2.5 font-medium transition-colors ${
              active
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-muted-foreground hover:border-neutral-300 hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
