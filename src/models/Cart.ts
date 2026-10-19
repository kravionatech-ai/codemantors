import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICartItem {
  courseId: Types.ObjectId;
  addedAt: Date;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  couponCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: [CartItemSchema],
    couponCode: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>("Cart", CartSchema);

export default Cart;
