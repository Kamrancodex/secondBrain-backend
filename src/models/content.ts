import mongoose, { Schema, Document } from "mongoose";

// Content Interface
interface IContent extends Document {
  title: string;
  type: string;
  link: string;
  tags: string[];
  user: mongoose.Types.ObjectId;
}

const ContentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  link: { type: String, required: true },
  tags: { type: [String], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference
});

export const Content = mongoose.model<IContent>("Content", ContentSchema);
