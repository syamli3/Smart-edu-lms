// backend/src/models/enrollment.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrolledAt: Date;
  status: "active" | "completed" | "dropped";
  progress: number; // 0–100 percent
  completedLessons: mongoose.Types.ObjectId[];
  certificateIssued: boolean;
  grade?: string;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "completed", "dropped"],
      default: "active",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completedLessons: [
      {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    grade: {
      type: String,
      enum: ["A", "B", "C", "D", "F", null],
      default: null,
    },
  },
  { timestamps: true }
);

// One student can only enroll in a course once
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ status: 1 });

export default mongoose.model<IEnrollment>("Enrollment", enrollmentSchema);
