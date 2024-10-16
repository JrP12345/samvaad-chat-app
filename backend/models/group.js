// models/Group.js
import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true, unique: true },
  members: [{ type: String }], // Assuming members are stored by their usernames
  createdAt: { type: Date, default: Date.now },
});

export const Group = mongoose.model("Group", groupSchema);
