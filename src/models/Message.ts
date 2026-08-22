import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver?: mongoose.Types.ObjectId; // If null/undefined, it's a message to general admin pool
  content: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: false, default: '' },
    imageUrl: { type: String, required: false },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

if (mongoose.models.Message) {
  delete mongoose.models.Message;
}

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);
