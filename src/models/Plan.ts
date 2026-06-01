import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IPlanLimits {
  products:   number; // -1 = unlimited
  categories: number;
  brands:     number;
  orders:     number;
  users:      number;
  storage:    number; // MB, -1 = unlimited
}

export interface IPlan extends Document {
  _id:         mongoose.Types.ObjectId;
  name:        "free" | "basic" | "pro";
  nameAr:      string;
  displayName: string;
  description: string;
  price:       number;  // monthly USD
  yearlyPrice: number;  // yearly USD
  currency:    string;
  limits:      IPlanLimits;
  features:    string[];
  featuresAr:  string[];
  isActive:    boolean;
  isFeatured:  boolean;
  sortOrder:   number;
  promoLabel?:   string;
  promoLabelAr?: string;
  // Stripe
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?:  string;
  stripeProductId?:      string;
  createdAt:   Date;
  updatedAt:   Date;
}

const PlanLimitsSchema = new Schema<IPlanLimits>(
  {
    products:   { type: Number, required: true, default: 100 },
    categories: { type: Number, required: true, default: 10  },
    brands:     { type: Number, required: true, default: 10  },
    orders:     { type: Number, required: true, default: 100 },
    users:      { type: Number, required: true, default: 5   },
    storage:    { type: Number, required: true, default: 500 },
  },
  { _id: false }
);

const PlanSchema = new Schema<IPlan>(
  {
    name:        { type: String, required: true, unique: true, enum: ["free", "basic", "pro"] },
    nameAr:      { type: String, required: true },
    displayName: { type: String, required: true },
    description: { type: String, required: true },
    price:       { type: Number, required: true, min: 0 },
    yearlyPrice: { type: Number, required: true, min: 0 },
    currency:    { type: String, default: "USD" },
    limits:      { type: PlanLimitsSchema, required: true },
    features:    [{ type: String }],
    featuresAr:  [{ type: String }],
    isActive:    { type: Boolean, default: true  },
    isFeatured:  { type: Boolean, default: false },
    sortOrder:   { type: Number,  default: 0     },
    promoLabel:   { type: String },
    promoLabelAr: { type: String },
    stripePriceIdMonthly: { type: String },
    stripePriceIdYearly:  { type: String },
    stripeProductId:      { type: String },
  },
  { timestamps: true }
);

PlanSchema.index({ name: 1 }, { unique: true });
PlanSchema.index({ isActive: 1 });

const Plan: Model<IPlan> =
  mongoose.models.Plan ?? mongoose.model<IPlan>("Plan", PlanSchema);

export default Plan;
