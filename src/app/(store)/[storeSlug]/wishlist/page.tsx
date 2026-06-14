import { redirect } from "next/navigation";
import Link from "next/link";
import { getCustomerFromCookie } from "@/lib/jwt/customer-jwt";
import { getCustomerWishlistAction } from "@/actions/customer-account";
import { ProductCard } from "@/components/store/product-card";
import { serializeMongoDocs } from "@/lib/utils/serialize";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export default async function StoreWishlistPage({ params }: Props) {
  const { storeSlug } = await params;
  const base = `/${storeSlug}`;

  const customer = await getCustomerFromCookie(storeSlug);
  if (!customer) redirect(`${base}/login?callbackUrl=${base}/wishlist`);

  const result = await getCustomerWishlistAction(storeSlug);
  if (!result.success) redirect(`${base}/login`);

  const products = serializeMongoDocs(result.data?.products ?? []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-2 font-serif">المفضلة</h1>
      <p className="text-sm text-muted-foreground mb-8">{customer.storeName}</p>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">قائمة المفضلة فارغة</h2>
          <Button asChild className="store-btn-primary mt-4">
            <Link href={`${base}/products`}>تصفح المنتجات</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={String(product._id)}
              product={product}
              storeSlug={storeSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
