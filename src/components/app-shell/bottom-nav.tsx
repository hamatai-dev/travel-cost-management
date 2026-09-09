"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { LayoutList, PlusCircle, Upload, PieChart, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { listPendingTransactions, localDb } from "@/lib/db/localDb";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "取引", icon: LayoutList },
  { href: "/entry", label: "入力", icon: PlusCircle },
  { href: "/import", label: "取込", icon: Upload },
  { href: "/dashboard", label: "集計", icon: PieChart },
  { href: "/settings", label: "設定", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const pendingCount = useLiveQuery(
    () => listPendingTransactions(localDb).then((rows) => rows.length),
    [],
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <ul className="mx-auto flex max-w-2xl">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const showBadge = href === "/entry" && !!pendingCount && pendingCount > 0;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-xs",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
                      {pendingCount}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
