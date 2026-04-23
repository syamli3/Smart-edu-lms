// backend/src/models/quiz.model.ts
import mongoose, { Document, Schema } from "mongoose";

interface IOption {
  text: string;
  isCorrect: boolean;
}

interface IQuestion {
  questionText: string;
  options: IOption[];
  marks: number;
}

export interface IQuiz extends Document {
  title: string;
  course: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId; // Teacher / Admin
  questions: IQuestion[];
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  isPublished: boolean;
  deadline?: Date;
}

const questionSchema = new Schema<IQuestion>({
  questionText: { type: String, required: true },
  options: [
    {
      text: { type: String, required: true },
      isCorrect: { type: Boolean, default: false },
    },
  ],
  marks: { type: Number, default: 1 },
});

const quizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true, trim: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questions: [questionSchema],
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    durationMinutes: { type: Number, default: 30 },
    isPublished: { type: Boolean, default: false },
    deadline: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IQuiz>("Quiz", quizSchema);
