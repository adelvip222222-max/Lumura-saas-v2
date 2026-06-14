import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongodb";
import Store from "@/models/Store";
import { CustomerAuthForm } from "@/components/store-front/customer-auth-form";
import { getCurrentUser } from "@/lib/jwt/customer-jwt";
import { buildStorePublicTheme } from "@/lib/store/store-theme";

import "@/models";

interface Props {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function StoreLoginPage({ params, searchParams }: Props) {
  const { storeSlug } = await params;
  const sp = await searchParams;

  await connectToDatabase();
  const store = await Store.findOne({ slug: storeSlug, isDeleted: false, isActive: true }).lean();
  if (!store) notFound();

  const currentCustomer = await getCurrentUser();
  if (currentCustomer) {
    redirect(`/${storeSlug}/account`);
  }

  const theme = buildStorePublicTheme(store);

  return (
    <div className="min-h-screen bg-slate-50 py-10" dir={theme.isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            {store.logo ? (
              <Image
                src={store.logo}
                alt={store.name}
                width={96}
                height={96}
                className="mx-auto mb-4 h-20 w-20 rounded-lg object-contain"
              />
            ) : (
              <div
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-lg shadow-lg"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <span className="text-3xl font-black text-white">
                  {store.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h1 className="text-2xl font-black text-slate-950">مرحبًا بك في {store.name}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              صفحة مخصصة للعملاء لتسجيل الدخول أو إنشاء حساب ومتابعة الطلبات.
            </p>
          </div>

          <CustomerAuthForm
            storeSlug={storeSlug}
            storeName={theme.name}
            defaultTab={sp.tab === "register" ? "register" : "login"}
          />

          <div className="mt-6 space-y-2 text-center">
            <p className="text-sm">
              <Link href={`/${storeSlug}`} className="store-text-primary font-semibold hover:underline">
                العودة إلى المتجر
              </Link>
            </p>
            <p className="text-xs text-slate-400">
              {store.name} © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
