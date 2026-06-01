import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCategoriesAction } from "@/actions/categories";
import type { ICategory } from "@/lib/db/models/Category";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export default async function AdminCategoriesPage({ params }: Props) {
  const { storeSlug } = await params;
  const result = await getCategoriesAction(false);
  const categories = (result.data ?? []) as ICategory[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">{categories.length} categories</p>
        </div>
        <Button >
          <Link href={`/dashboard/stores/${storeSlug}/categories/new`}>
            <Plus className="h-4 w-4" />
            Add Category
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Subcategories</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No categories found
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat._id.toString()} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {cat.icon && <span>{cat.icon}</span>}
                      <span className="font-medium">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {cat.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">
                      {cat.subcategories.length} subcategories
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {cat.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {cat.isFeatured && <Badge>Featured</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button >
                      <Link href={`/dashboard/stores/${storeSlug}/categories/${cat.slug}/edit`}>Edit</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
