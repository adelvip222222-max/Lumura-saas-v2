import mongoose, { type Document, type Model, Schema } from "mongoose";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export type BillingCycle = "monthly" | "yearly";

export type PaymentMethod =
  | "stripe"
  | "instapay"
  | "vodafone_cash"
  | "orange_cash"
  | "etisalat_cash"
  | "we_pay"
  | "manual";

export interface IUsage {
  products:   number;
  categories: number;
  brands:     number;
  orders:     number;
  users:      number;
}

export interface ISubscription extends Document {
  _id:            mongoose.Types.ObjectId;
  userId:         mongoose.Types.ObjectId;
  storeId:        mongoose.Types.ObjectId;
  planId:         mongoose.Types.ObjectId;
  status:         SubscriptionStatus;
  billingCycle:   BillingCycle;
  paymentMethod:  PaymentMethod;
  currentUsage:   IUsage;
  // Dates
  startDate:      Date;
  endDate:        Date;
  trialEndDate?:  Date;
  canceledAt?:    Date;
  // Auto-renew
  autoRenew:      boolean;
  // Stripe fields
  stripeCustomerId?:     string;
  stripeSubscriptionId?: string;
  stripePriceId?:        string;
  stripeCurrentPeriodEnd?: Date;
  // Pricing snapshot
  pricePaid:    number;
  currency:     string;
  // Notes
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UsageSchema = new Schema<IUsage>(
  {
    products:   { type: Number, default: 0 },
    categories: { type: Number, default: 0 },
    brands:     { type: Number, default: 0 },
    orders:     { type: Number, default: 0 },
    users:      { type: Number, default: 0 },
  },
  { _id: false }
);

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId:  { type: Schema.Types.ObjectId, ref: "User",  required: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    planId:  { type: Schema.Types.ObjectId, ref: "Plan",  required: true },
    status:  {
      type: String,
      enum: ["trialing", "active", "past_due", "canceled", "unpaid", "paused"],
      default: "trialing",
    },
    billingCycle:  { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    paymentMethod: {
      type: String,
      enum: ["stripe", "instapay", "vodafone_cash", "orange_cash", "etisalat_cash", "we_pay", "manual"],
      default: "stripe",
    },
    currentUsage: { type: UsageSchema, default: () => ({}) },
    startDate:    { type: Date, required: true },
    endDate:      { type: Date, required: true },
    trialEndDate: { type: Date },
    canceledAt:   { type: Date },
    autoRenew:    { type: Boolean, default: true },
    stripeCustomerId:       { type: String },
    stripeSubscriptionId:   { type: String },
    stripePriceId:          { type: String },
    stripeCurrentPeriodEnd: { type: Date },
    pricePaid: { type: Number, default: 0 },
    currency:  { type: String, default: "USD" },
    notes:     { type: String },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId:  1 });
SubscriptionSchema.index({ storeId: 1 });
SubscriptionSchema.index({ status:  1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 });
SubscriptionSchema.index({ endDate: 1 });

const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ??
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);

export default Subscription;
