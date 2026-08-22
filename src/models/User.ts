import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary: boolean;
}

export interface IContactNumber {
  countryCode: string;
  number: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'customer' | 'admin';
  isVerified: boolean;
  avatar?: string;
  isChatBlocked?: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  addresses: IAddress[];
  contactNumber?: IContactNumber;
  wishlist: mongoose.Types.ObjectId[];
}

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  isPrimary: { type: Boolean, default: false },
});

const ContactNumberSchema = new Schema<IContactNumber>({
  countryCode: { type: String, required: true },
  number: { type: String, required: true },
});

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    isVerified: { type: Boolean, default: false },
    avatar: { type: String },
    isChatBlocked: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    addresses: [AddressSchema],
    contactNumber: ContactNumberSchema,
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
