"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "대시보드" },
  { href: "/youngkul", label: "영끌족" },
  { href: "/debt-invest", label: "빚투족" },
  { href: "/saver", label: "예금족" },
  { href: "/matrix", label: "승자·패자" },
  { href: "/data", label: "데이터" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-inset font-medium text-strong"
                : "text-muted hover:bg-hover hover:text-soft"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
