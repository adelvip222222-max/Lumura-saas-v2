"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getTenantsAction,
  suspendTenantAction,
  activateTenantAction,
  updateTenantAction,
} from "@/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Loader2,
  Ban,
  CheckCircle,
  Pencil,
  X,
} from "lucide-react";

interface TenantRow {
  _id: string;
  name: string;
  email: string;
  slug: string;
  status: string;
  plan: string;
  role: string;
  maxStores: number;
  maxProducts: number;
  subscriptionEnd?: string;
  createdAt: string;
}

const statusVariant: Record<string, "default" | "secondary" | "warning" | "destructive"> = {
  ACTIVE: "default",
  PENDING: "warning",
  SUSPENDED: "destructive",
  EXPIRED: "destructive",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "نشط",
  PENDING: "قيد المراجعة",
  SUSPENDED: "موقوف",
  EXPIRED: "منتهي",
};

const planLabel: Record<string, string> = {
  MONTHLY: "شهري",
  SEMI_ANNUAL: "نصف سنوي",
  YEARLY: "سنوي",
};

export function TenantsTable() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editing, setEditing] = useState<TenantRow | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getTenantsAction(page, 10, search);
    if (res.success && res.data) {
      setTenants(res.data.items as TenantRow[]);
      setTotalPages(res.data.pagination.pages ?? 1);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleSuspend = async (id: string) => {
    setActionId(id);
    const res = await suspendTenantAction(id);
    setMessage(res.success ? "تم إيقاف الحساب" : res.error ?? "فشل الإيقاف");
    setActionId(null);
    load();
  };

  const handleActivate = async (id: string) => {
    setActionId(id);
    const res = await activateTenantAction(id);
    setMessage(res.success ? "تم تفعيل الحساب" : res.error ?? "فشل التفعيل");
    setActionId(null);
    load();
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    setActionId(editing._id);
    const res = await updateTenantAction(editing._id, {
      name: form.get("name") as string,
      email: form.get("email") as string,
      phone: (form.get("phone") as string) || undefined,
      status: form.get("status") as "PENDING" | "ACTIVE" | "SUSPENDED" | "EXPIRED",
      plan: form.get("plan") as "MONTHLY" | "SEMI_ANNUAL" | "YEARLY",
      maxStores: Number(form.get("maxStores")),
      maxProducts: Number(form.get("maxProducts")),
      subscriptionEnd: new Date(form.get("subscriptionEnd") as string),
    });
    setMessage(res.success ? "تم حفظ التعديلات" : res.error ?? "فشل الحفظ");
    setActionId(null);
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {message}
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="بحث بالاسم أو البريد أو المعرف..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pr-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-right font-medium">المستأجر</th>
                <th className="px-4 py-3 text-right font-medium">الحالة</th>
                <th className="px-4 py-3 text-right font-medium">الخطة</th>
                <th className="px-4 py-3 text-right font-medium">انتهاء الاشتراك</th>
                <th className="px-4 py-3 text-right font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    لا يوجد مستأجرون
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.email}</p>
                      <p className="text-xs text-gray-400">{t.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[t.status] ?? "secondary"}>
                        {statusLabel[t.status] ?? t.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{planLabel[t.plan] ?? t.plan}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.subscriptionEnd
                        ? formatDate(t.subscriptionEnd)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing(t)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {t.status === "ACTIVE" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            disabled={actionId === t._id}
                            onClick={() => handleSuspend(t._id)}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            disabled={actionId === t._id}
                            onClick={() => handleActivate(t._id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            السابق
          </Button>
          <span className="flex items-center px-2 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </Button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">تعديل المستأجر</h3>
              <button type="button" onClick={() => setEditing(null)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <Label>الاسم</Label>
                <Input name="name" defaultValue={editing.name} required />
              </div>
              <div>
                <Label>البريد</Label>
                <Input name="email" type="email" defaultValue={editing.email} required />
              </div>
              <div>
                <Label>الهاتف</Label>
                <Input name="phone" />
              </div>
              <div>
                <Label>الحالة</Label>
                <select
                  name="status"
                  defaultValue={editing.status}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="ACTIVE">نشط</option>
                  <option value="PENDING">قيد المراجعة</option>
                  <option value="SUSPENDED">موقوف</option>
                  <option value="EXPIRED">منتهي</option>
                </select>
              </div>
              <div>
                <Label>خطة الاشتراك (مستوى المنصة)</Label>
                <select
                  name="plan"
                  defaultValue={editing.plan}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="MONTHLY">شهري</option>
                  <option value="SEMI_ANNUAL">نصف سنوي</option>
                  <option value="YEARLY">سنوي</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>حد المتاجر</Label>
                  <Input
                    name="maxStores"
                    type="number"
                    min={1}
                    defaultValue={editing.maxStores}
                  />
                </div>
                <div>
                  <Label>حد المنتجات</Label>
                  <Input
                    name="maxProducts"
                    type="number"
                    min={1}
                    defaultValue={editing.maxProducts}
                  />
                </div>
              </div>
              <div>
                <Label>تاريخ انتهاء الاشتراك</Label>
                <Input
                  name="subscriptionEnd"
                  type="date"
                  defaultValue={
                    editing.subscriptionEnd
                      ? new Date(editing.subscriptionEnd).toISOString().slice(0, 10)
                      : ""
                  }
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={actionId === editing._id}>
                  حفظ
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
