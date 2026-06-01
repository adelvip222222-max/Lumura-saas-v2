import mongoose, { type Document, type Model, Schema } from "mongoose";
import type { PaymentMethod } from "./Subscription";

export type ProofStatus = "pending" | "approved" | "rejected";

export interface IPaymentProof extends Document {
  _id:            mongoose.Types.ObjectId;
  userId:         mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  storeId:        mongoose.Types.ObjectId;
  planId:         mongoose.Types.ObjectId;
  // Payment details
  paymentMethod:  PaymentMethod;
  amount:         number;
  currency:       string;
  billingCycle:   "monthly" | "yearly";
  // Proof
  proofImageUrl:  string;
  proofPublicId:  string;
  senderName?:    string;
  senderPhone?:   string;
  transactionRef?: string;
  notes?:         string;
  // Review
  status:         ProofStatus;
  reviewedBy?:    mongoose.Types.ObjectId;
  reviewedAt?:    Date;
  rejectReason?:  string;
  createdAt:      Date;
  updatedAt:      Date;
}

const PaymentProofSchema = new Schema<IPaymentProof>(
  {
    userId:         { type: Schema.Types.ObjectId, ref: "User",         required: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", required: true },
    storeId:        { type: Schema.Types.ObjectId, ref: "Store",        required: true },
    planId:         { type: Schema.Types.ObjectId, ref: "Plan",         required: true },
    paymentMethod:  {
      type: String,
      enum: ["instapay", "vodafone_cash", "orange_cash", "etisalat_cash", "we_pay", "manual"],
      required: true,
    },
    amount:       { type: Number, required: true, min: 0 },
    currency:     { type: String, default: "EGP" },
    billingCycle: { type: String, enum: ["monthly", "yearly"], required: true },
    proofImageUrl: { type: String, required: true },
    proofPublicId: { type: String, required: true },
    senderName:    { type: String, trim: true },
    senderPhone:   { type: String, trim: true },
    transactionRef: { type: String, trim: true },
    notes:         { type: String, trim: true },
    status:        { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy:    { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt:    { type: Date },
    rejectReason:  { type: String },
  },
  { timestamps: true }
);

PaymentProofSchema.index({ userId:  1 });
PaymentProofSchema.index({ status:  1 });
PaymentProofSchema.index({ storeId: 1 });
PaymentProofSchema.index({ createdAt: -1 });

const PaymentProof: Model<IPaymentProof> =
  mongoose.models.PaymentProof ??
  mongoose.model<IPaymentProof>("PaymentProof", PaymentProofSchema);

export default PaymentProof;
