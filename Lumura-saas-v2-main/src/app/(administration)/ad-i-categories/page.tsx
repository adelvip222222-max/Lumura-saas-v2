import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createAdministrationCategoryAction,
  getAdministrationCategories,
  updateAdministrationCategoryAction,
} from "./action";

export default async function AdministrationCategoriesPage() {
  const { categories, store } = await getAdministrationCategories();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">إدارة الفئات</h2>
        <p className="mt-1 text-sm text-gray-500">تنظيم فئات المنتجات لمتجر {store.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">إضافة فئة</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await createAdministrationCategoryAction(formData);
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
              <span className="font-medium text-gray-700">الترتيب</span>
              <Input name="sortOrder" type="number" defaultValue="0" />
            </label>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 text-sm">
                <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 accent-orange-500" />
                نشطة
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input name="isFeatured" type="checkbox" className="h-4 w-4 accent-orange-500" />
                مميزة
              </label>
            </div>
            <label className="space-y-1 text-sm lg:col-span-4">
              <span className="font-medium text-gray-700">الوصف</span>
              <Textarea name="description" rows={3} />
            </label>
            <div className="lg:col-span-4">
              <Button type="submit">إضافة الفئة</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الفئات الحالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-2">
            {categories.map((category) => (
              <form
                key={category.id}
                action={async (formData) => {
                  "use server";
                  await updateAdministrationCategoryAction(formData);
                }}
                className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
              >
                <input type="hidden" name="categoryId" value={category.id} />
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900">{category.nameAr || category.name}</h3>
                  <Badge variant={category.isActive ? "success" : "secondary"}>
                    {category.isActive ? "نشطة" : "موقوفة"}
                  </Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input name="name" defaultValue={category.name} required />
                  <Input name="nameAr" defaultValue={category.nameAr} />
                  <Input name="sortOrder" type="number" defaultValue={category.sortOrder} />
                </div>
                <Textarea name="description" defaultValue={category.description} rows={2} />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input name="isActive" type="checkbox" defaultChecked={category.isActive} className="h-4 w-4 accent-orange-500" />
                      نشطة
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input name="isFeatured" type="checkbox" defaultChecked={category.isFeatured} className="h-4 w-4 accent-orange-500" />
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
