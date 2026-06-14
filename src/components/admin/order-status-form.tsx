"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/admin/form-field";
import { updateOrderStatusAction } from "@/actions/orders";
import type { OrderStatus } from "@/types";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded",
];

interface Props {
  orderId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusForm({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const params = useParams<{ storeSlug: string }>();
  const storeSlug = params.storeSlug || "";
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (status === currentStatus) {
      toast.info("Status unchanged");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateOrderStatusAction(
        storeSlug,
        orderId,
        status,
        trackingNumber || undefined,
        cancelReason || undefined
      );

      if (!result.success) {
        toast.error(result.error ?? "Failed to update status");
        return;
      }

      toast.success(result.message ?? "Status updated");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Update Status</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <FormField label="New Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring capitalize"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </FormField>

        {status === "shipped" && (
          <FormField label="Tracking Number">
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. 1Z999AA10123456784"
            />
          </FormField>
        )}

        {status === "cancelled" && (
          <FormField label="Cancel Reason">
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
            />
          </FormField>
        )}

        <Button
          onClick={handleUpdate}
          loading={isSubmitting}
          disabled={status === currentStatus}
          className="w-full"
        >
          Update Status
        </Button>
      </CardContent>
    </Card>
  );
}
