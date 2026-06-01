// src/components/providers/cart-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCartStore } from "@/store/cart-store";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  
  // تأكد من تحميل الـ store
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null; // أو return skeleton
  }

  return <>{children}</>;
}