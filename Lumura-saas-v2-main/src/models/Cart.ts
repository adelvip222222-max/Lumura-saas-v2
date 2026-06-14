// src/models/Cart.ts
import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
  sku: string;
}

export interface ICart extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;     // ✅ المستأجر
  storeId: mongoose.Types.ObjectId;      // ✅ المتجر
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  items: ICartItem[];
  couponCode?: string;
  discount: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    stock: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "Tenant ID is required"],
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store ID is required"],
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    sessionId: { type: String },
    items: [CartItemSchema],
    couponCode: { type: String, uppercase: true, trim: true },
    discount: { type: Number, default: 0, min: 0 },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  { timestamps: true }
);

// ✅ Indexes معدلة
CartSchema.index({ tenantId: 1, storeId: 1, userId: 1 });
CartSchema.index({ tenantId: 1, storeId: 1, sessionId: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Cart: Model<ICart> =
  mongoose.models.Cart ?? mongoose.model<ICart>("Cart", CartSchema);

export default Cart;
