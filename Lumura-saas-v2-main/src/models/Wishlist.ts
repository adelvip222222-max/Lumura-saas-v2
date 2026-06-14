// src/models/Wishlist.ts
import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IWishlistItem {
  productId: mongoose.Types.ObjectId;
  addedAt: Date;
}

export interface IWishlist extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;     // ✅ المستأجر
  storeId: mongoose.Types.ObjectId;      // ✅ المتجر
  userId: mongoose.Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const WishlistSchema = new Schema<IWishlist>(
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [WishlistItemSchema],
  },
  { timestamps: true }
);

// ✅ Indexes معدلة
WishlistSchema.index({ tenantId: 1, storeId: 1, userId: 1 }, { unique: true });
WishlistSchema.index({ storeId: 1, "items.productId": 1 });

const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist ?? mongoose.model<IWishlist>("Wishlist", WishlistSchema);

export default Wishlist;
