"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import PaymentProof from "@/models/PaymentProof";
import Subscription from "@/models/Subscription";
import Store from "@/models/Store";
import Plan from "@/models/Plan";
import Notification from "@/models/Notification";
import AuditLog from "@/models/AuditLog";
import { auth } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import { z } from "zod";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { IPaymentProof } from "@/models/PaymentProof";

// ─── Submit payment proof ─────────────────────────────────────────────────────
const submitProofSchema = z.object({
  storeId:        z.string().min(1),
  planId:         z.string().min(1),
  billingCycle:   z.enum(["monthly", "yearly"]),
  paymentMethod:  z.enum(["instapay", "vodafone_cash", "orange_cash", "etisalat_cash", "we_pay"]),
  proofImageUrl:  z.string().url("Invalid image URL"),
  proofPublicId:  z.string().min(1),
  senderName:     z.string().optional(),
  senderPhone:    z.string().optional(),
  transactionRef: z.string().optional(),
  notes:          z.string().max(500).optional(),
});

export async function submitPaymentProofAction(
  rawData: unknown
): Promise<ApiResponse<{ proofId: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  const parsed = submitProofSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  try {
    await connectToDatabase();

    // Get plan to determine amount
    const plan = await Plan.findById(data.planId);
    if (!plan) return { success: false, error: "Plan not found" };

    const amount =
      data.billingCycle === "yearly" ? plan.yearlyPrice : plan.price;

    // Check for pending proof (prevent duplicate submissions)
    const existingPending = await PaymentProof.findOne({
      storeId: data.storeId,
      userId:  session.user.id,
      status:  "pending",
    });

    if (existingPending) {
      return {
        success: false,
        error: "You already have a pending payment proof under review.",
      };
    }

    // Get subscription
    const sub = await Subscription.findOne({ storeId: data.storeId });
    if (!sub) return { success: false, error: "Subscription not found" };

    const proof = await PaymentProof.create({
      userId:         session.user.id,
      subscriptionId: sub._id,
      storeId:        data.storeId,
      planId:         data.planId,
      paymentMethod:  data.paymentMethod,
      amount,
      currency:       "EGP",
      billingCycle:   data.billingCycle,
      proofImageUrl:  data.proofImageUrl,
      proofPublicId:  data.proofPublicId,
      senderName:     data.senderName,
      senderPhone:    data.senderPhone,
      transactionRef: data.transactionRef,
      notes:          data.notes,
      status:         "pending",
    });

    // Notify admins (create notification for super_admin)
    // In production: query all super_admins and notify each
    await Notification.create({
      userId:    session.user.id,
      storeId:   data.storeId,
      type:      "payment_success",
      title:     "Payment Proof Submitted",
      titleAr:   "تم إرسال إثبات الدفع",
      message:   "Your payment proof has been submitted and is under review. We'll notify you once approved.",
      messageAr: "تم إرسال إثبات دفعك وهو قيد المراجعة. سنخطرك عند الموافقة.",
      link:      "/dashboard/subscription",
    });

    return {
      success: true,
      data:    { proofId: proof._id.toString() },
      message: "Payment proof submitted successfully. Under review.",
    };
  } catch (err) {
    console.error("Submit proof error:", err);
    return { success: false, error: "Failed to submit payment proof" };
  }
}

// ─── Get my payment proofs ────────────────────────────────────────────────────
export async function getMyPaymentProofsAction(
  storeId: string
): Promise<ApiResponse<IPaymentProof[]>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    const proofs = await PaymentProof.find({
      storeId,
      userId: session.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return { success: true, data: serialize(proofs) as unknown as IPaymentProof[] };
  } catch {
    return { success: false, error: "Failed to fetch payment proofs" };
  }
}

// ─── ADMIN: Get all pending proofs ────────────────────────────────────────────
export async function getAdminPaymentProofsAction(rawFilters: {
  status?: string;
  page?:   number;
  limit?:  number;
}): Promise<ApiResponse<PaginatedResponse<IPaymentProof>>> {
  const session = await auth();
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  const page  = rawFilters.page  ?? 1;
  const limit = rawFilters.limit ?? 20;
  const skip  = (page - 1) * limit;

  try {
    await connectToDatabase();

    const query = rawFilters.status ? { status: rawFilters.status } : {};

    const [proofs, total] = await Promise.all([
      PaymentProof.find(query)
        .populate("userId",  "name email")
        .populate("storeId", "name slug")
        .populate("planId",  "displayName name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PaymentProof.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        data: serialize(proofs) as unknown as IPaymentProof[],
        pagination: {
          page, limit, total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    };
  } catch {
    return { success: false, error: "Failed to fetch payment proofs" };
  }
}

// ─── ADMIN: Approve payment proof ─────────────────────────────────────────────
export async function approvePaymentProofAction(
  proofId: string
): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    const proof = await PaymentProof.findById(proofId);
    if (!proof) return { success: false, error: "Proof not found" };
    if (proof.status !== "pending") {
      return { success: false, error: "Proof already reviewed" };
    }

    // Calculate new end date
    const now     = new Date();
    const endDate = new Date(now);
    if (proof.billingCycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Update proof
    await PaymentProof.findByIdAndUpdate(proofId, {
      status:     "approved",
      reviewedBy: session.user.id,
      reviewedAt: now,
    });

    // Activate subscription
    await Subscription.findByIdAndUpdate(proof.subscriptionId, {
      status:        "active",
      planId:        proof.planId,
      paymentMethod: proof.paymentMethod,
      billingCycle:  proof.billingCycle,
      pricePaid:     proof.amount,
      currency:      proof.currency,
      startDate:     now,
      endDate,
      autoRenew:     false, // manual payments don't auto-renew
    });

    // Activate store
    await Store.findByIdAndUpdate(proof.storeId, {
      isActive: true,
    });

    // Notify user
    await Notification.create({
      userId:    proof.userId,
      storeId:   proof.storeId,
      type:      "payment_approved",
      title:     "Payment Approved",
      titleAr:   "تمت الموافقة على الدفع",
      message:   "Your payment has been approved and your subscription is now active.",
      messageAr: "تمت الموافقة على دفعتك واشتراكك نشط الآن.",
      link:      "/dashboard/subscription",
    });

    // Audit log
    await AuditLog.create({
      userId:     session.user.id,
      userEmail:  session.user.email,
      userRole:   session.user.role,
      action:     "UPDATE",
      resource:   "PaymentProof",
      resourceId: proofId,
      details:    { action: "approved", storeId: proof.storeId.toString() },
      success:    true,
    });

    return { success: true, message: "Payment approved and subscription activated" };
  } catch (err) {
    console.error("Approve proof error:", err);
    return { success: false, error: "Failed to approve payment" };
  }
}

// ─── ADMIN: Reject payment proof ──────────────────────────────────────────────
export async function rejectPaymentProofAction(
  proofId:      string,
  rejectReason: string
): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  if (!rejectReason?.trim()) {
    return { success: false, error: "Reject reason is required" };
  }

  try {
    await connectToDatabase();

    const proof = await PaymentProof.findById(proofId);
    if (!proof) return { success: false, error: "Proof not found" };
    if (proof.status !== "pending") {
      return { success: false, error: "Proof already reviewed" };
    }

    await PaymentProof.findByIdAndUpdate(proofId, {
      status:       "rejected",
      reviewedBy:   session.user.id,
      reviewedAt:   new Date(),
      rejectReason: rejectReason.trim(),
    });

    // Notify user
    await Notification.create({
      userId:    proof.userId,
      storeId:   proof.storeId,
      type:      "payment_rejected",
      title:     "Payment Rejected",
      titleAr:   "تم رفض الدفع",
      message:   `Your payment proof was rejected. Reason: ${rejectReason}`,
      messageAr: `تم رفض إثبات دفعك. السبب: ${rejectReason}`,
      link:      "/dashboard/subscription",
    });

    return { success: true, message: "Payment rejected" };
  } catch {
    return { success: false, error: "Failed to reject payment" };
  }
}
