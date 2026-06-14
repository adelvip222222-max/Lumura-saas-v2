// src/providers/direction-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Direction = "ltr" | "rtl";

interface DirectionContextType {
  direction: Direction;
  setDirection: (dir: Direction) => void;
  toggleDirection: () => void;
}

const DirectionContext = createContext<DirectionContextType>({
  direction: "rtl",
  setDirection: () => {},
  toggleDirection: () => {},
});

export function useDirection() {
  return useContext(DirectionContext);
}

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const [direction, setDirection] = useState<Direction>("rtl");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // ✅ قراءة الاتجاه من localStorage
    const savedDir = localStorage.getItem("direction") as Direction;
    if (savedDir) {
      setDirection(savedDir);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      // ✅ تحديث HTML dir attribute
      document.documentElement.dir = direction;
      document.documentElement.lang = direction === "rtl" ? "ar" : "en";
      localStorage.setItem("direction", direction);
    }
  }, [direction, mounted]);

  const toggleDirection = () => {
    setDirection(prev => prev === "rtl" ? "ltr" : "rtl");
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <DirectionContext.Provider value={{ direction, setDirection, toggleDirection }}>
      {children}
    </DirectionContext.Provider>
  );
}