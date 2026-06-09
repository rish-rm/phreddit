import mongoose from "mongoose";

const linkFlairSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      unique: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("LinkFlair", linkFlairSchema);
