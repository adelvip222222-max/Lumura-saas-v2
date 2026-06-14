"use client";

import type { Session } from "next-auth";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface SuperAdminHeaderProps {
  user: Session["user"];
  title: string;
  description?: string;
}

export function SuperAdminHeader({ user, title, description }: SuperAdminHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/"
          target="_blank"
          className="hidden items-center gap-1 text-sm text-orange-600 hover:text-orange-700 sm:flex"
        >
          <ExternalLink className="h-4 w-4" />
          الصفحة الرئيسية
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-medium text-white">
            {getInitials(user.name ?? "Admin")}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
