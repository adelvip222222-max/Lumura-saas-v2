// src/app/dashboard/stores/[storeSlug]/products/[productSlug]/edit/page.tsx
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongodb";
import Product from "@/models/Product";
import Store from "@/models/Store";
import { serialize } from "@/lib/serialize";
import { ProductEditForm } from "./product-edit-form";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ storeSlug: string; productSlug: string }>;  // use productSlug
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productSlug } = await params;  // use productSlug
  await connectToDatabase();
  const product = await Product.findOne({ slug: productSlug }).select("name").lean();
  return { title: product ? `تعديل: ${product.name}` : "تعديل المنتج" };
}

export default async function EditProductPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || !["super_admin", "tenant_admin", "store_admin"].includes(session.user.role)) {
    redirect("/login");
  }

  const { storeSlug, productSlug } = await params; 
  await connectToDatabase();
  
  // التحقق من وجود المتجر
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) {
    redirect("/dashboard");
  }
  
  // جلب المنتج باستخدام السلاج
  const raw = await Product.findOne({ slug: productSlug })
    .populate("category", "name _id subcategories")
    .populate("brand", "name _id")
    .lean();

  if (!raw) notFound();
  
  // التحقق من أن المنتج يتبع هذا المتجر
  if (raw.storeId?.toString() !== store._id.toString()) {
    redirect("/unauthorized");
  }
  
  // التحقق من صلاحية المستخدم
  if (session.user.role !== "super_admin") {
    if (raw.tenantId?.toString() !== session.user.tenantId) {
      redirect("/unauthorized");
    }
  }

  const product = {
    ...serialize(raw),
    _id: raw._id?.toString?.() || raw._id,
    category: raw.category ? {
      ...serialize(raw.category),
      _id: raw.category._id?.toString?.() || raw.category._id,
    } : null,
    brand: raw.brand ? {
      ...serialize(raw.brand),
      _id: raw.brand._id?.toString?.() || raw.brand._id,
    } : null,
    storeId: raw.storeId?.toString?.() || raw.storeId,
    tenantId: raw.tenantId?.toString?.() || raw.tenantId,
  };

  const backPath = `/dashboard/stores/${storeSlug}/products`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`تعديل: ${product.name}`}
        description="تحديث تفاصيل المنتج"
      >
        <Button variant="outline">
          <Link href={backPath}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة إلى المنتجات
          </Link>
        </Button>
      </PageHeader>
      <ProductEditForm product={product} storeSlug={storeSlug} />
    </div>
  );
}
