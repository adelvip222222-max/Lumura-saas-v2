// src/components/admin/staff-panel.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createStaffAction,
  deleteStoreStaffAction,
  getStoreStaffAction,
  getTenantAssignableStoresAction,
  toggleStoreStaffAction,
} from "@/actions/staff";
import {
  ADMIN_PERMISSIONS,
  PERMISSION_LABELS,
  type AdminPermission,
  type Permission,
} from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Ban,
  CheckCircle,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Store,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

interface StaffAccessRow {
  storeId: string;
  storeSlug: string;
  storeName: string;
  permissions: Permission[];
  isManager: boolean;
}

interface StaffRow {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  isThisStore?: boolean;
  staffAccess?: StaffAccessRow[];
  permissions?: Permission[];
  isManager?: boolean;
}

interface AssignableStore {
  id: string;
  name: string;
  slug: string;
}

interface StoreAccessForm {
  storeSlug: string;
  permissions: AdminPermission[];
  isManager: boolean;
}

interface StaffPanelProps {
  storeSlug: string;
}

const emptyForm = (storeSlug: string) => ({
  name: "",
  email: "",
  password: "",
  access: [
    {
      storeSlug,
      permissions: ["manage_orders"] as AdminPermission[],
      isManager: false,
    },
  ] as StoreAccessForm[],
});

export function StaffPanel({ storeSlug }: StaffPanelProps) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [stores, setStores] = useState<AssignableStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm(storeSlug));

  const load = useCallback(async () => {
    setLoading(true);
    const [staffRes, storesRes] = await Promise.all([
      getStoreStaffAction(storeSlug),
      getTenantAssignableStoresAction(),
    ]);

    if (staffRes.success && staffRes.data) setStaff(staffRes.data as StaffRow[]);
    if (storesRes.success && storesRes.data) {
      const nextStores = storesRes.data as AssignableStore[];
      setStores(nextStores);
      setForm((current) => ({
        ...current,
        access:
          current.access.length > 0
            ? current.access
            : [
                {
                  storeSlug: nextStores[0]?.slug ?? storeSlug,
                  permissions: ["manage_orders"],
                  isManager: false,
                },
              ],
      }));
    }

    setLoading(false);
  }, [storeSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedStoreSlugs = useMemo(
    () => new Set(form.access.map((item) => item.storeSlug)),
    [form.access]
  );

  const toggleStore = (slug: string, checked: boolean) => {
    setForm((current) => {
      if (!checked) {
        return {
          ...current,
          access: current.access.filter((item) => item.storeSlug !== slug),
        };
      }

      if (current.access.some((item) => item.storeSlug === slug)) return current;

      return {
        ...current,
        access: [
          ...current.access,
          {
            storeSlug: slug,
            permissions: ["manage_orders"],
            isManager: false,
          },
        ],
      };
    });
  };

  const updateAccess = (slug: string, patch: Partial<StoreAccessForm>) => {
    setForm((current) => ({
      ...current,
      access: current.access.map((item) =>
        item.storeSlug === slug ? { ...item, ...patch } : item
      ),
    }));
  };

  const togglePermission = (
    slug: string,
    permission: AdminPermission,
    checked: boolean
  ) => {
    const access = form.access.find((item) => item.storeSlug === slug);
    if (!access) return;

    const permissions = checked
      ? [...new Set([...access.permissions, permission])]
      : access.permissions.filter((item) => item !== permission);

    updateAccess(slug, { permissions });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("الاسم مطلوب");
      return;
    }
    if (!form.email.trim()) {
      toast.error("البريد الإلكتروني مطلوب");
      return;
    }
    if (!form.password || form.password.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (form.access.length === 0) {
      toast.error("اختر متجرًا واحدًا على الأقل");
      return;
    }
    if (
      form.access.some(
        (item) => !item.isManager && item.permissions.length === 0
      )
    ) {
      toast.error("اختر صلاحية واحدة على الأقل لكل متجر أو اجعل الموظف مديرًا");
      return;
    }

    setSaving(true);
    const res = await createStaffAction({
      name: form.name,
      email: form.email,
      password: form.password,
      access: form.access,
    });

    if (res.success) {
      toast.success(res.message ?? "تم حفظ الموظف بنجاح");
      setShowForm(false);
      setForm(emptyForm(storeSlug));
      await load();
      router.refresh();
    } else {
      toast.error(res.error ?? "فشل حفظ الموظف");
    }

    setSaving(false);
  };

  const handleToggle = async (id: string, active: boolean) => {
    const res = await toggleStoreStaffAction(id, active);
    if (res.success) {
      toast.success(res.message ?? (active ? "تم تفعيل الموظف" : "تم إيقاف الموظف"));
      load();
    } else {
      toast.error(res.error ?? "فشل تحديث حالة الموظف");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الموظف؟")) return;
    const res = await deleteStoreStaffAction(id);
    if (res.success) {
      toast.success(res.message ?? "تم حذف الموظف بنجاح");
      load();
    } else {
      toast.error(res.error ?? "فشل حذف الموظف");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 text-sm text-orange-900">
        <p className="font-medium">نظام الصلاحيات الجديد</p>
        <p className="mt-1 text-orange-800">
          يمكن للموظف الواحد إدارة أكثر من متجر، وأكثر من صلاحية داخل كل متجر.
          المتاجر منتهية الاشتراك لا تظهر ضمن المتاجر المتاحة للإسناد.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">فريق العمل</h3>
          <p className="text-sm text-gray-500">{staff.length} موظف</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowForm((open) => !open)}
          className="bg-orange-500 hover:bg-orange-600"
          disabled={staff.length >= 4}
        >
          إضافة موظف
        </Button>
        
    <p className="text-sm text-gray-500">{staff.length} / 4 موظفين</p>
      </div>

{stores.length === 0 && (
  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
    لا توجد متاجر تابعة لهذا المستأجر.
  </div>
)}
      

      {showForm && stores.length > 0 && (
        <form
          onSubmit={handleCreate}
          className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h4 className="border-b pb-2 font-medium text-gray-900">
            إضافة أو تحديث موظف
          </h4>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4" />
                الاسم الكامل
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4" />
                البريد الإلكتروني
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 text-gray-700">
                <KeyRound className="h-4 w-4" />
                كلمة المرور
              </Label>
              <Input
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-gray-700">
              <Store className="h-4 w-4" />
              المتاجر والصلاحيات
            </Label>

            <div className="grid gap-3">
              {stores.map((storeItem) => {
                const access = form.access.find(
                  (item) => item.storeSlug === storeItem.slug
                );
                const selected = selectedStoreSlugs.has(storeItem.slug);

                return (
                  <div
                    key={storeItem.id}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <label className="flex items-center gap-2 font-medium text-gray-900">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => toggleStore(storeItem.slug, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-orange-600"
                      />
                      {storeItem.name}
                    </label>

                    {access && (
                      <div className="mt-4 space-y-3 pr-6">
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-orange-700">
                          <input
                            type="checkbox"
                            checked={access.isManager}
                            onChange={(e) =>
                              updateAccess(storeItem.slug, {
                                isManager: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-orange-600"
                          />
                          مدير على هذا المتجر
                        </label>

                        {!access.isManager && (
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {ADMIN_PERMISSIONS.map((permission) => (
                              <label
                                key={permission}
                                className="inline-flex items-center gap-2 rounded-md border border-gray-100 px-3 py-2 text-sm text-gray-700"
                              >
                                <input
                                  type="checkbox"
                                  checked={access.permissions.includes(permission)}
                                  onChange={(e) =>
                                    togglePermission(
                                      storeItem.slug,
                                      permission,
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-orange-600"
                                />
                                {PERMISSION_LABELS[permission].ar}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600">
              {saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "جاري الحفظ..." : "حفظ الموظف"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      )}

      {staff.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
          <UserPlus className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="text-gray-500">لم تضف موظفين بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <div
              key={member._id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 font-bold text-white">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 pr-12">
                  {member.staffAccess?.map((access) => (
                    <Badge
                      key={access.storeSlug}
                      variant="secondary"
                      className="bg-orange-100 text-orange-700"
                    >
                      {access.storeName}:{" "}
                      {access.isManager
                        ? "مدير"
                        : `${access.permissions.length} صلاحية`}
                    </Badge>
                  ))}

                  {member.isManager && (
                    <Badge variant="outline" className="border-green-300 text-green-600">
                      <ShieldCheck className="ml-1 h-3 w-3" />
                      مدير
                    </Badge>
                  )}
                  {!member.isActive && <Badge variant="destructive">موقوف</Badge>}
                  {member.isThisStore && (
                    <Badge variant="outline" className="border-green-300 text-green-600">
                      هذا المتجر
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {member.isActive ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(member._id, false)}
                    title="إيقاف الموظف"
                  >
                    <Ban className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-300 text-green-600 hover:bg-green-50"
                    onClick={() => handleToggle(member._id, true)}
                    title="تفعيل الموظف"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(member._id)}
                  title="حذف الموظف"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
