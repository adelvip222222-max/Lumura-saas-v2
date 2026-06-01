"use client";

import { Button } from "@/components/ui/button";

export function CancelOrderButton(_props: { orderId?: string; base?: string }) {
  return (
    <Button type="button" variant="outline" disabled>
      Cancel order
    </Button>
  );
}
