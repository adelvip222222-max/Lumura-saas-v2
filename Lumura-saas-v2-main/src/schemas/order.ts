import { z } from "zod";

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "Full name is required").trim(),
  phone: z
    .string()
    .min(7, "Phone number is required")
    .regex(/^[+\d\s\-()]+$/, "Invalid phone number")
    .trim(),
  street: z.string().min(5, "Street address is required").trim(),
  city: z.string().min(2, "City is required").trim(),
  state: z.string().min(2, "State is required").trim(),
  country: z.string().min(2, "Country is required").trim(),
  zipCode: z.string().min(3, "ZIP code is required").trim(),
});

export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["cash_on_delivery", "stripe", "paypal"]),
  notes: z.string().max(500).optional(),
  couponCode: z.string().toUpperCase().trim().optional(),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  trackingNumber: z.string().optional(),
  cancelReason: z.string().optional(),
});

export const orderFilterSchema = z.object({
  status: z
    .enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"])
    .optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
