import { NextResponse } from "next/server";
import { getAdministrationContext } from "@/lib/administration/context";
import { connectToDatabase } from "@/lib/db/mongodb";
import Order from "@/models/Order";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const ctx = await getAdministrationContext("view_reports");
  await connectToDatabase();

  const orders = await Order.find({ storeId: ctx.storeId })
    .select("orderNumber status paymentStatus paymentMethod subtotal tax shipping discount total createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const headers = [
    "Order Number",
    "Status",
    "Payment Status",
    "Payment Method",
    "Subtotal",
    "Tax",
    "Shipping",
    "Discount",
    "Total",
    "Created At",
  ];
  const rows = orders.map((order: any) => [
    order.orderNumber,
    order.status,
    order.paymentStatus,
    order.paymentMethod,
    order.subtotal,
    order.tax,
    order.shipping,
    order.discount,
    order.total,
    order.createdAt ? new Date(order.createdAt).toISOString() : "",
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ctx.storeSlug}-financial-report.csv"`,
    },
  });
}
