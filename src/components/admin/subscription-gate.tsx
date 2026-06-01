"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  storeSlug: string;
  storeName: string;
  isExpired: boolean;
  endDate?: string;
  children: React.ReactNode;
}

export function SubscriptionGate({
  storeSlug,
  storeName,
  isExpired,
  endDate,
  children,
}: Props) {
  const pathname = usePathname();
  const onSubscriptionPage = pathname.includes("/subscription");

  if (!isExpired || onSubscriptionPage) {
    return <>{children}</>;
  }

  const renewHref = `/dashboard/stores/${storeSlug}/subscription`;
  const formattedEnd = endDate
    ? new Date(endDate).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-lg w-full border-destructive/30 shadow-lg">
        <CardContent className="pt-8 pb-8 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">المتجر معلّق</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              انتهت باقة متجر <strong className="text-foreground">{storeName}</strong>
              {formattedEnd ? (
                <> بتاريخ <strong className="text-foreground">{formattedEnd}</strong></>
              ) : null}
              . لا يمكن إدارة المتجر أو فتحه للزوار حتى تجديد الاشتراك.
            </p>
          </div>
          <Button variant="primary" size="lg" className="w-full sm:w-auto" asChild>
            <Link href={renewHref}>
              <CreditCard className="h-4 w-4 ml-2" />
              تجديد الباقة
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            بعد التجديد سيعود المتجر للعمل تلقائياً
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
