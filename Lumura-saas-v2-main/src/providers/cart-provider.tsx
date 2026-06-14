// src/providers/cart-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCartStore } from "@/store/cart-store";

// ✅ سياق للتأكد من أن الكارت متاح
const CartHydrationContext = createContext<boolean>(false);

export function useCartHydration() {
  return useContext(CartHydrationContext);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    // ✅ تفعيل الهايدريشن بعد التحميل
    useCartStore.persist.rehydrate();
    setIsHydrated(true);
  }, []);

  return (
    <CartHydrationContext.Provider value={isHydrated}>
      {children}
    </CartHydrationContext.Provider>
  );
}