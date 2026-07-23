import mongoose from "mongoose";

const linkFlairSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 30
    }
  },
  { timestamps: true }
);

export default mongoose.model("LinkFlair", linkFlairSchema);
