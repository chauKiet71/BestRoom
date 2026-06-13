"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

function getItemsFromPath(pathname: string, isEditPage: boolean): BreadcrumbItem[] {
  if (pathname === "/" || pathname.startsWith("/admin") || pathname.startsWith("/user/")) {
    return [];
  }

  if (pathname === "/search") {
    return [
      { label: "Trang chủ", href: "/" },
      { label: "Tìm phòng" },
    ];
  }

  if (pathname.startsWith("/rooms/")) {
    return [
      { label: "Trang chủ", href: "/" },
      { label: "Tìm phòng", href: "/search" },
      { label: "Chi tiết phòng" },
    ];
  }

  if (pathname === "/favorites") {
    return [
      { label: "Trang chủ", href: "/" },
      { label: "Yêu thích" },
    ];
  }

  return [{ label: "Trang chủ", href: "/" }];
}

function BreadcrumbTrail({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav className="bg-[#f8fbff]" aria-label="Breadcrumb">
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-4 text-sm font-black sm:px-6 lg:px-8">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <span key={`${item.label}-${index}`} className="flex items-center gap-3">
              {item.href && !isLast ? (
                <Link href={item.href} className="text-blue-600 hover:text-blue-800">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-slate-700" : "text-blue-600"}>{item.label}</span>
              )}
              {!isLast && <ChevronRight className="h-4 w-4 text-slate-400" />}
            </span>
          );
        })}
      </div>
    </nav>
  );
}

function AutoBreadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return <BreadcrumbTrail items={getItemsFromPath(pathname, searchParams.has("edit"))} />;
}

export default function Breadcrumbs({ items }: { items?: BreadcrumbItem[] }) {
  return items ? <BreadcrumbTrail items={items} /> : <AutoBreadcrumbs />;
}
