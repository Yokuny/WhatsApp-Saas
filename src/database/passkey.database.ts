import mongoose from "mongoose";

const passkeySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  originalId: { type: mongoose.Schema.Types.ObjectId, required: true },
  email: { type: String, required: false },
  type: { type: String, enum: ["signup", "passwordReset", "dataAccess"], default: "signup" },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 43200 },
});

export const Passkey = mongoose.model("Passkey", passkeySchema);
