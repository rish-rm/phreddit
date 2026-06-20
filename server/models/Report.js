import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    targetPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    reason: {
      type: String,
      enum: ["spam", "harassment", "off-topic", "other"],
      required: true
    },
    details: {
      type: String,
      trim: true,
      maxlength: 400,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "dismissed", "content_removed"],
      default: "pending",
      index: true
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: 400,
      default: ""
    }
  },
  { timestamps: true }
);

reportSchema.index(
  { targetPost: 1, reportedBy: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" }
  }
);

export default mongoose.model("Report", reportSchema);
