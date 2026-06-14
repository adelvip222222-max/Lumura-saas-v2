"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAdminPaymentProofsAction,
  approvePaymentProofAction,
  rejectPaymentProofAction,
} from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2, Check, X } from "lucide-react";

interface ProofRow {
  _id: string;
  status: string;
  amount: number;
  currency: string;
  billingCycle: string;
  paymentMethod: string;
  createdAt: string;
  userId?: { name?: string; email?: string };
  storeId?: { name?: string; slug?: string };
  planId?: { displayName?: string; name?: string };
}

const statusLabel: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "موافق عليه",
  rejected: "مرفوض",
};

export function PaymentProofsTable() {
  const [proofs, setProofs] = useState<ProofRow[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAdminPaymentProofsAction({
      status: filter || undefined,
      page: 1,
      limit: 30,
    });
    if (res.success && res.data) {
      const list = res.data.data ?? res.data.items ?? [];
      setProofs(list as ProofRow[]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    setActionId(id);
    const res = await approvePaymentProofAction(id);
    setMessage(res.success ? "تمت الموافقة" : res.error ?? "فشل");
    setActionId(null);
    load();
  };

  const reject = async (id: string) => {
    const reason = prompt("سبب الرفض (اختياري):") ?? "مرفوض";
    setActionId(id);
    const res = await rejectPaymentProofAction(id, reason);
    setMessage(res.success ? "تم الرفض" : res.error ?? "فشل");
    setActionId(null);
    load();
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          {message}
        </div>
      )}

      <div className="flex gap-2">
        {["pending", "approved", "rejected", ""].map((s) => (
          <Button
            key={s || "all"}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
          >
            {s === "" ? "الكل" : statusLabel[s] ?? s}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {proofs.length === 0 ? (
            <p className="py-8 text-center text-gray-500">لا توجد إثباتات</p>
          ) : (
            proofs.map((p) => (
              <div
                key={p._id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {p.storeId?.name ?? "متجر"} — {p.planId?.displayName ?? "خطة"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {p.userId?.name} ({p.userId?.email})
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(p.createdAt)} — {p.paymentMethod} — {p.billingCycle}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-orange-600">
                    {formatCurrency(p.amount, p.currency)}
                  </span>
                  <Badge
                    variant={p.status === "pending" ? "warning" : "secondary"}
                  >
                    {statusLabel[p.status] ?? p.status}
                  </Badge>
                  {p.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        disabled={actionId === p._id}
                        onClick={() => approve(p._id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        disabled={actionId === p._id}
                        onClick={() => reject(p._id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
