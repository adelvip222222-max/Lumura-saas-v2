// src/models/VerificationToken.ts
import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IVerificationToken extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  code: string;      // رمز التحقق المكون من 6 أرقام
  type: "email_verification" | "password_reset";
  expiresAt: Date;
  createdAt: Date;
}

const VerificationTokenSchema = new Schema<IVerificationToken>(
  {
    email: { type: String, required: true, lowercase: true },
    code: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["email_verification", "password_reset"],
      required: true 
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Auto-delete after expiration
VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
VerificationTokenSchema.index({ email: 1, type: 1 });

const VerificationToken: Model<IVerificationToken> =
  mongoose.models.VerificationToken ??
  mongoose.model<IVerificationToken>("VerificationToken", VerificationTokenSchema);

export default VerificationToken;
