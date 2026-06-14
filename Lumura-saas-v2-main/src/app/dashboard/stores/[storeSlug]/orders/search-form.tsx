// src/app/dashboard/stores/[storeSlug]/orders/search-form.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function SearchForm({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    
    router.push(`/dashboard/stores/${storeSlug}/orders?${params.toString()}`);
  };

  const handleClear = () => {
    setSearch("");
    setStatus("");
    router.push(`/dashboard/stores/${storeSlug}/orders`);
  };

  const hasFilters = search || status;

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث برقم الطلب أو اسم العميل..."
            className="w-full pr-10 pl-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
        >
          <option value="">جميع الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="confirmed">مؤكد</option>
          <option value="processing">قيد التجهيز</option>
          <option value="shipped">تم الشحن</option>
          <option value="delivered">تم التوصيل</option>
          <option value="cancelled">ملغي</option>
        </select>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
            <Search className="h-4 w-4 ml-2" />
            بحث
          </Button>

          {hasFilters && (
            <Button type="button" variant="outline" onClick={handleClear}>
              <X className="h-4 w-4 ml-2" />
              مسح
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}