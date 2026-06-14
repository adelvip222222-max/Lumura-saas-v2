"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    stock: number;
    sku: string;
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const disabled = product.stock <= 0;

  const handleAddToCart = () => {
    if (disabled) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      quantity,
      image: product.image,
      sku: product.sku,
      stock: product.stock,
    });
    toast.success("تم إضافة المنتج إلى السلة بنجاح! 🛒");
  };

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center rounded-full border bg-white p-1">
        <button
          type="button"
          className="rounded-full p-2 hover:bg-orange-50"
          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          disabled={disabled}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
        <button
          type="button"
          className="rounded-full p-2 hover:bg-orange-50"
          onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <Button
        type="button"
        disabled={disabled}
        onClick={handleAddToCart}
        className="h-12 w-full rounded-full bg-orange-600 font-bold hover:bg-orange-700 text-white"
      >
        <ShoppingCart className="h-4 w-4 ml-2" />
        {disabled ? "Out of stock" : "Add to cart"}
      </Button>
    </div>
  );
}
