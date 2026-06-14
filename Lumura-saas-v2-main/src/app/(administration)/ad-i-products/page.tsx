import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import {
  createAdministrationProductAction,
  deleteAdministrationProductAction,
  getAdministrationProducts,
  updateAdministrationProductAction,
} from "./action";
import { ProductImageUploader } from "./product-image-uploader";

const unitTypes = [
  { value: "piece", label: "قطعة" },
  { value: "kg", label: "كيلو" },
  { value: "gram", label: "جرام" },
  { value: "liter", label: "لتر" },
  { value: "meter", label: "متر" },
  { value: "box", label: "علبة" },
  { value: "pack", label: "باك" },
  { value: "set", label: "طقم" },
  { value: "pair", label: "زوج" },
];

export default async function AdministrationProductsPage() {
  const { products, store, categories, brands, canApprove } = await getAdministrationProducts();
  const canCreate = categories.length > 0 && brands.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h2>
          <p className="mt-1 text-sm text-gray-500">
            إضافة وتعديل المنتجات والصور والأسعار والمخزون لمتجر {store.name}
          </p>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3 text-sm text-gray-600">
          المنتجات: <span className="font-bold text-gray-900">{products.length}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">إضافة منتج جديد</CardTitle>
        </CardHeader>
        <CardContent>
          {!canCreate ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              يجب إضافة فئة وماركة أولًا من لوحة المتجر حتى يمكن إنشاء منتج كامل.
            </p>
          ) : (
            <form
              action={async (formData) => {
                "use server";
                await createAdministrationProductAction(formData);
              }}
              className="grid gap-4 lg:grid-cols-4"
            >
              <ProductImageUploader storeSlug={store.slug} />

              <label className="space-y-1 text-sm lg:col-span-2">
                <span className="font-medium text-gray-700">اسم المنتج</span>
                <Input name="name" required minLength={2} maxLength={200} placeholder="مثال: طاولة قهوة" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">SKU</span>
                <Input name="sku" required minLength={2} maxLength={80} placeholder="TABLE001" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">الباركود</span>
                <Input name="barcode" maxLength={80} placeholder="اختياري" />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">الفئة</span>
                <select name="category" required className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm">
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">الماركة</span>
                <select name="brand" required className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm">
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">الوحدة</span>
                <select name="unitType" className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm">
                  {unitTypes.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">المخزون</span>
                <Input name="stockQuantity" type="number" min="0" defaultValue="0" />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">سعر الشراء</span>
                <Input name="purchasePrice" type="number" step="0.01" min="0" defaultValue="0" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">سعر البيع</span>
                <Input name="sellingPrice" type="number" step="0.01" min="0.01" required />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">سعر الجملة</span>
                <Input name="wholesalePrice" type="number" step="0.01" min="0" defaultValue="0" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">سعر الخصم</span>
                <Input name="discountPrice" type="number" step="0.01" min="0" placeholder="اختياري" />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">حد التنبيه</span>
                <Input name="lowStockThreshold" type="number" min="0" defaultValue="10" />
              </label>
              <label className="space-y-1 text-sm lg:col-span-3">
                <span className="font-medium text-gray-700">الوسوم</span>
                <Input name="tags" placeholder="خشب, منزلي, جديد" />
              </label>

              <label className="space-y-1 text-sm lg:col-span-4">
                <span className="font-medium text-gray-700">وصف مختصر</span>
                <Input name="shortDescription" maxLength={500} placeholder="ملخص يظهر في بطاقات المنتجات" />
              </label>
              <label className="space-y-1 text-sm lg:col-span-4">
                <span className="font-medium text-gray-700">الوصف الكامل</span>
                <Textarea name="description" required minLength={10} rows={4} placeholder="اكتب وصفًا واضحًا للمنتج..." />
              </label>

              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 lg:col-span-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">المواصفات</p>
                  <p className="text-xs text-gray-500">أضف أهم المواصفات التي تظهر في صفحة المنتج.</p>
                </div>
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="grid gap-3 md:grid-cols-2">
                    <Input name="specKey" placeholder="المواصفة، مثال: الخامة" />
                    <Input name="specValue" placeholder="القيمة، مثال: خشب طبيعي" />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 lg:col-span-3">
                <label className="flex items-center gap-2 text-sm">
                  <input name="isActive" type="checkbox" defaultChecked={canApprove} className="h-4 w-4 accent-orange-500" />
                  نشط
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input name="isFeatured" type="checkbox" className="h-4 w-4 accent-orange-500" />
                  مميز
                </label>
                {!canApprove && (
                  <span className="text-xs text-amber-700">
                    سيتم إرسال المنتج للمراجعة قبل ظهوره في المتجر.
                  </span>
                )}
              </div>
              <div className="lg:col-span-1">
                <Button type="submit" className="w-full">
                  إضافة المنتج
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">المنتجات الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">لا توجد منتجات حتى الآن.</p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {products.map((product) => (
                <div key={product.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <form
                    action={async (formData) => {
                      "use server";
                      await updateAdministrationProductAction(formData);
                    }}
                    className="space-y-4"
                  >
                    <input type="hidden" name="productId" value={product.id} />
                    <div className="flex items-start gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {product.thumbnail ? (
                          <Image src={product.thumbnail} alt={product.name} fill className="object-cover" sizes="64px" />
                        ) : (
                          <div className="grid h-full place-items-center text-xs text-gray-400">صورة</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-gray-900">{product.name}</h3>
                        <p className="mt-1 text-xs text-gray-500">{product.sku}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Badge variant={product.isActive ? "success" : "secondary"}>
                          {product.isActive ? "نشط" : "موقوف"}
                        </Badge>
                        {product.stockQuantity <= product.lowStockThreshold && (
                          <Badge variant="destructive">مخزون منخفض</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-gray-700">الاسم</span>
                        <Input name="name" defaultValue={product.name} required />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-gray-700">SKU</span>
                        <Input name="sku" defaultValue={product.sku} required />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-gray-700">سعر الشراء</span>
                        <Input name="purchasePrice" type="number" step="0.01" min="0" defaultValue={product.purchasePrice} />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-gray-700">سعر البيع</span>
                        <Input name="sellingPrice" type="number" step="0.01" min="0.01" defaultValue={product.price} />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-gray-700">سعر الجملة</span>
                        <Input name="wholesalePrice" type="number" step="0.01" min="0" defaultValue={product.wholesalePrice} />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-gray-700">سعر الخصم</span>
                        <Input name="discountPrice" type="number" step="0.01" min="0" defaultValue={product.discountPrice} />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-gray-700">المخزون</span>
                        <Input name="stockQuantity" type="number" min="0" defaultValue={product.stockQuantity} />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="font-medium text-gray-700">حد التنبيه</span>
                        <Input name="lowStockThreshold" type="number" min="0" defaultValue={product.lowStockThreshold} />
                      </label>
                      <div className="rounded-md bg-gray-50 p-3 text-sm">
                        <span className="text-gray-500">السعر الحالي</span>
                        <p className="mt-1 font-bold text-gray-900">{formatCurrency(product.price)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input name="isActive" type="checkbox" defaultChecked={product.isActive} className="h-4 w-4 accent-orange-500" />
                          نشط
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input name="isFeatured" type="checkbox" defaultChecked={product.isFeatured} className="h-4 w-4 accent-orange-500" />
                          مميز
                        </label>
                      </div>
                      <Button type="submit">حفظ التعديل</Button>
                    </div>
                  </form>
                  <form
                    action={async (formData) => {
                      "use server";
                      await deleteAdministrationProductAction(formData);
                    }}
                    className="mt-3 border-t pt-3"
                  >
                    <input type="hidden" name="productId" value={product.id} />
                    <Button type="submit" variant="destructive" className="w-full">
                      حذف المنتج
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
