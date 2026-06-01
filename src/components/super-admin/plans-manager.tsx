"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPlansAction,
  updatePlanAction,
} from "@/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Save, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface PlanRow {
  _id: string;
  name: string;
  nameAr: string;
  displayName: string;
  description: string;
  price: number;
  yearlyPrice: number;
  currency: string;
  limits: {
    products: number;
    categories: number;
    brands: number;
    orders: number;
    users: number;
    storage: number;
  };
  features: string[];
  featuresAr: string[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  promoLabel?: string;
  promoLabelAr?: string;
}

function normalizePlan(raw: Record<string, unknown>): PlanRow {
  const limits = (raw.limits as PlanRow["limits"]) ?? {
    products: 100,
    categories: 10,
    brands: 10,
    orders: 100,
    users: 5,
    storage: 500,
  };

  return {
    _id: String(raw._id),
    name: String(raw.name ?? ""),
    nameAr: String(raw.nameAr ?? raw.displayName ?? ""),
    displayName: String(raw.displayName ?? ""),
    description: String(raw.description ?? ""),
    price: Number(raw.price ?? 0),
    yearlyPrice: Number(raw.yearlyPrice ?? 0),
    currency: String(raw.currency ?? "EGP"),
    limits,
    features: Array.isArray(raw.features) ? (raw.features as string[]) : [],
    featuresAr: Array.isArray(raw.featuresAr)
      ? (raw.featuresAr as string[])
      : Array.isArray(raw.features)
        ? (raw.features as string[])
        : [],
    isActive: raw.isActive !== false,
    isFeatured: Boolean(raw.isFeatured),
    sortOrder: Number(raw.sortOrder ?? 0),
    promoLabel: raw.promoLabel ? String(raw.promoLabel) : undefined,
    promoLabelAr: raw.promoLabelAr ? String(raw.promoLabelAr) : undefined,
  };
}

export function PlansManager() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Partial<PlanRow>>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getPlansAction();
    if (res.success && res.data) {
      setPlans(
        (res.data as Record<string, unknown>[]).map((p) => normalizePlan(p))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getDraft = (plan: PlanRow) => drafts[plan._id] ?? {};

  const updateDraft = (id: string, patch: Partial<PlanRow>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const val = <K extends keyof PlanRow>(plan: PlanRow, key: K): PlanRow[K] => {
    const d = getDraft(plan)[key];
    return (d !== undefined ? d : plan[key]) as PlanRow[K];
  };

  const handleSave = async (plan: PlanRow) => {
    const d = getDraft(plan);
    setSavingId(plan._id);
    const res = await updatePlanAction(plan._id, {
      nameAr: d.nameAr ?? plan.nameAr,
      displayName: d.displayName ?? plan.displayName,
      description: d.description ?? plan.description,
      price: Number(d.price ?? plan.price),
      yearlyPrice: Number(d.yearlyPrice ?? plan.yearlyPrice),
      currency: d.currency ?? plan.currency,
      limits: d.limits ?? plan.limits,
      features: (d.features as string[] | undefined) ?? plan.features,
      featuresAr: (d.featuresAr as string[] | undefined) ?? plan.featuresAr,
      isActive: d.isActive ?? plan.isActive,
      isFeatured: d.isFeatured ?? plan.isFeatured,
      sortOrder: Number(d.sortOrder ?? plan.sortOrder),
      promoLabel: d.promoLabel ?? plan.promoLabel,
      promoLabelAr: d.promoLabelAr ?? plan.promoLabelAr,
    });
    setMessage(res.success ? "تم حفظ الخطة" : res.error ?? "فشل الحفظ");
    setSavingId(null);
    if (res.success) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[plan._id];
        return next;
      });
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {message}
        </div>
      )}
      <p className="text-sm text-gray-600">
        هذه الخطط تظهر على الصفحة الرئيسية للمنصة. عدّل الأسعار والمميزات والعروض ثم احفظ كل خطة.
      </p>

      {plans.map((plan) => {
        const featuresText = (
          getDraft(plan).featuresAr ?? plan.featuresAr ?? []
        ).join("\n");
        const isActive = val(plan, "isActive");
        const isFeatured = val(plan, "isFeatured");

        return (
          <div
            key={plan._id}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">
                {val(plan, "nameAr")} ({plan.name})
              </h3>
              {isFeatured && (
                <Badge className="bg-orange-100 text-orange-700">
                  <Star className="ml-1 h-3 w-3" />
                  مميز
                </Badge>
              )}
              {!isActive && <Badge variant="destructive">معطّل</Badge>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>الاسم (عربي)</Label>
                <Input
                  defaultValue={plan.nameAr}
                  onChange={(e) => updateDraft(plan._id, { nameAr: e.target.value })}
                />
              </div>
              <div>
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  defaultValue={plan.displayName}
                  onChange={(e) =>
                    updateDraft(plan._id, { displayName: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>الوصف</Label>
                <Input
                  defaultValue={plan.description}
                  onChange={(e) =>
                    updateDraft(plan._id, { description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>السعر الشهري ({plan.currency})</Label>
                <Input
                  type="number"
                  min={0}
                  defaultValue={plan.price}
                  onChange={(e) =>
                    updateDraft(plan._id, { price: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>السعر السنوي</Label>
                <Input
                  type="number"
                  min={0}
                  defaultValue={plan.yearlyPrice}
                  onChange={(e) =>
                    updateDraft(plan._id, { yearlyPrice: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>نص العرض (عربي)</Label>
                <Input
                  placeholder="مثال: خصم 20%"
                  defaultValue={plan.promoLabelAr ?? ""}
                  onChange={(e) =>
                    updateDraft(plan._id, { promoLabelAr: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>نص العرض (إنجليزي)</Label>
                <Input
                  placeholder="e.g. Save 20%"
                  defaultValue={plan.promoLabel ?? ""}
                  onChange={(e) =>
                    updateDraft(plan._id, { promoLabel: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>حد المنتجات (-1 = غير محدود)</Label>
                <Input
                  type="number"
                  defaultValue={plan.limits.products}
                  onChange={(e) =>
                    updateDraft(plan._id, {
                      limits: {
                        ...plan.limits,
                        products: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label>ترتيب العرض</Label>
                <Input
                  type="number"
                  defaultValue={plan.sortOrder}
                  onChange={(e) =>
                    updateDraft(plan._id, { sortOrder: Number(e.target.value) })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>المميزات (سطر لكل ميزة)</Label>
                <textarea
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  rows={4}
                  defaultValue={featuresText}
                  onChange={(e) =>
                    updateDraft(plan._id, {
                      featuresAr: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-6 md:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) =>
                      updateDraft(plan._id, { isActive: checked })
                    }
                  />
                  نشط على الموقع
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={isFeatured}
                    onCheckedChange={(checked) =>
                      updateDraft(plan._id, { isFeatured: checked })
                    }
                  />
                  خطة مميزة (عرض على الرئيسية)
                </label>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-sm text-gray-500">
                المعروض: {formatCurrency(val(plan, "price"), plan.currency)} / شهر
              </span>
              <Button
                onClick={() => handleSave(plan)}
                disabled={savingId === plan._id}
              >
                <Save className="ml-2 h-4 w-4" />
                حفظ
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
