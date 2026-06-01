// src/components/store/StoreHeader.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ShoppingCart, User, Search } from "lucide-react";

interface StoreHeaderProps {
  store: {
    _id: string;
    name: string;
    logo?: string;
    slug: string;
  };
}

export default function StoreHeader({ store }: StoreHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href={`/${store.slug}`} className="flex items-center gap-2">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="w-10 h-10 rounded-lg" />
            ) : (
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {store.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="font-bold text-xl text-gray-800">{store.name}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8">
            <Link href={`/${store.slug}`} className="text-gray-600 hover:text-orange-500 transition">
              الرئيسية
            </Link>
            <Link href={`/${store.slug}/products`} className="text-gray-600 hover:text-orange-500 transition">
              المنتجات
            </Link>
            <Link href={`/${store.slug}/categories`} className="text-gray-600 hover:text-orange-500 transition">
              الفئات
            </Link>
            <Link href={`/${store.slug}/contact`} className="text-gray-600 hover:text-orange-500 transition">
              اتصل بنا
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full transition">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <Link href={`/${store.slug}/cart`} className="p-2 hover:bg-gray-100 rounded-full transition relative">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                0
              </span>
            </Link>
            <Link href={`/${store.slug}/account`} className="p-2 hover:bg-gray-100 rounded-full transition">
              <User className="w-5 h-5 text-gray-600" />
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t">
            <nav className="flex flex-col gap-4">
              <Link href={`/${store.slug}`} className="text-gray-600 hover:text-orange-500 py-2">
                الرئيسية
              </Link>
              <Link href={`/${store.slug}/products`} className="text-gray-600 hover:text-orange-500 py-2">
                المنتجات
              </Link>
              <Link href={`/${store.slug}/categories`} className="text-gray-600 hover:text-orange-500 py-2">
                الفئات
              </Link>
              <Link href={`/${store.slug}/contact`} className="text-gray-600 hover:text-orange-500 py-2">
                اتصل بنا
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
