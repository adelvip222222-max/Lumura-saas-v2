import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createAdministrationBrandAction,
  getAdministrationBrands,
  updateAdministrationBrandAction,
} from "./action";

export default async function AdministrationBrandsPage() {
  const { brands, store } = await getAdministrationBrands();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">إدارة الماركات</h2>
        <p className="mt-1 text-sm text-gray-500">إدارة ماركات المنتجات لمتجر {store.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">إضافة ماركة</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await createAdministrationBrandAction(formData);
            }}
            className="grid gap-4 lg:grid-cols-4"
          >
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">الاسم</span>
              <Input name="name" required minLength={2} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">الاسم العربي</span>
              <Input name="nameAr" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">الموقع</span>
              <Input name="website" type="url" placeholder="https://example.com" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">الترتيب</span>
              <Input name="sortOrder" type="number" defaultValue="0" />
            </label>
            <label className="space-y-1 text-sm lg:col-span-4">
              <span className="font-medium text-gray-700">الوصف</span>
              <Textarea name="description" rows={3} />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 accent-orange-500" />
                  نشطة
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input name="isFeatured" type="checkbox" className="h-4 w-4 accent-orange-500" />
                  مميزة
                </label>
              </div>
              <Button type="submit">إضافة الماركة</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الماركات الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-2">
            {brands.map((brand) => (
              <form
                key={brand.id}
                action={async (formData) => {
                  "use server";
                  await updateAdministrationBrandAction(formData);
                }}
                className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
              >
                <input type="hidden" name="brandId" value={brand.id} />
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900">{brand.nameAr || brand.name}</h3>
                  <Badge variant={brand.isActive ? "success" : "secondary"}>
                    {brand.isActive ? "نشطة" : "موقوفة"}
                  </Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input name="name" defaultValue={brand.name} required />
                  <Input name="nameAr" defaultValue={brand.nameAr} />
                  <Input name="website" type="url" defaultValue={brand.website} />
                  <Input name="sortOrder" type="number" defaultValue={brand.sortOrder} />
                </div>
                <Textarea name="description" defaultValue={brand.description} rows={2} />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input name="isActive" type="checkbox" defaultChecked={brand.isActive} className="h-4 w-4 accent-orange-500" />
                      نشطة
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input name="isFeatured" type="checkbox" defaultChecked={brand.isFeatured} className="h-4 w-4 accent-orange-500" />
                      مميزة
                    </label>
                  </div>
                  <Button type="submit">حفظ</Button>
                </div>
              </form>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
