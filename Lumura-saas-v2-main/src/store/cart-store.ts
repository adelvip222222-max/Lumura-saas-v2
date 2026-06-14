import { create } from "zustand";
import { persist } from "zustand/middleware";
import { siteConfig } from "@/config/site";

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
  sku?: string;
  stock: number;
}

interface CartStore {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  refreshCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

function clampQuantity(quantity: number, stock: number) {
  const safeStock = Math.max(1, Number(stock) || 1);
  return Math.min(safeStock, Math.max(1, Number(quantity) || 1));
}

function calculateTotals(items: CartItem[], discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * siteConfig.tax.rate;
  const shipping =
    subtotal === 0 || subtotal >= siteConfig.shipping.freeAbove
      ? 0
      : siteConfig.shipping.basePrice;
  const total = Math.max(0, subtotal + tax + shipping - discount);

  return {
    subtotal,
    tax,
    shipping,
    discount,
    total,
  };
}

const emptyTotals = calculateTotals([]);

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      ...emptyTotals,

      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.productId === item.productId);
          let items: CartItem[];

          if (existingItem) {
            items = state.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: clampQuantity(i.quantity + (item.quantity || 1), i.stock) }
                : i
            );
          } else {
            items = [
              ...state.items,
              { ...item, quantity: clampQuantity(item.quantity || 1, item.stock) },
            ];
          }

          return {
            items,
            ...calculateTotals(items, state.discount),
          };
        });
      },

      removeItem: (productId) => {
        set((state) => {
          const items = state.items.filter((i) => i.productId !== productId);

          return {
            items,
            ...calculateTotals(items, state.discount),
          };
        });
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          const items = state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: clampQuantity(quantity, i.stock) }
              : i
          );

          return {
            items,
            ...calculateTotals(items, state.discount),
          };
        });
      },

      clearCart: () => set({ items: [], ...calculateTotals([], 0) }),

      refreshCart: () => {
        set((state) => {
          const items = state.items.map((item) => ({
            ...item,
            quantity: clampQuantity(item.quantity, item.stock),
          }));

          return {
            items,
            ...calculateTotals(items, state.discount),
          };
        });
      },

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: "cart-storage",
      onRehydrateStorage: () => (state) => {
        state?.refreshCart();
      },
    }
  )
);
