// src/components/store/StoreFooter.tsx
import Link from "next/link";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

interface StoreFooterProps {
  store: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    slug: string;
  };
}

export default function StoreFooter({ store }: StoreFooterProps) {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">{store.name}</h3>
            <p className="text-gray-400 text-sm">
              متجرك الإلكتروني الموثوق لأفضل المنتجات بأفضل الأسعار
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href={`/${store.slug}`} className="hover:text-orange-400">الرئيسية</Link></li>
              <li><Link href={`/${store.slug}/products`} className="hover:text-orange-400">المنتجات</Link></li>
              <li><Link href={`/${store.slug}/about`} className="hover:text-orange-400">من نحن</Link></li>
              <li><Link href={`/${store.slug}/contact`} className="hover:text-orange-400">اتصل بنا</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">معلومات الاتصال</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              {store.email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{store.email}</span>
                </li>
              )}
              {store.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{store.phone}</span>
                </li>
              )}
              {store.address && (
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{store.address}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-4">تابعنا</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} {store.name}. جميع الحقوق محفوظة
        </div>
      </div>
    </footer>
  );
}
