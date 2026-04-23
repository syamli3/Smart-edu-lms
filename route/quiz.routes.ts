// backend/src/routes/quiz.routes.ts
import { Router, Request, Response } from "express";
import Quiz from "../models/quiz.model";
import { authMiddleware, roleGuard } from "../middleware/auth.middleware";

const router = Router();

// ─── POST /api/quizzes ────────────────────────────────────────────────────────
// Teacher creates a quiz for a course
router.post(
  "/",
  authMiddleware,
  roleGuard("teacher", "admin"),
  async (req: Request, res: Response) => {
    try {
      const teacherId = (req as any).user._id;

      // Auto-calculate totalMarks from questions
      const totalMarks = req.body.questions?.reduce(
        (sum: number, q: any) => sum + (q.marks || 1),
        0
      ) ?? 0;

      const quiz = await Quiz.create({
        ...req.body,
        createdBy: teacherId,
        totalMarks,
      });

      res.status(201).json({ success: true, data: quiz });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// ─── GET /api/quizzes/course/:courseId ───────────────────────────────────────
// Get all published quizzes for a course (students see published only)
router.get("/course/:courseId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const role = (req as any).user.role;
    const filter: any = { course: req.params.courseId };

    // Students only see published quizzes
    if (role === "student") filter.isPublished = true;

    const quizzes = await Quiz.find(filter)
      .select("-questions.options.isCorrect") // hide answers from students
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: quizzes });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/quizzes/:id ─────────────────────────────────────────────────────
// Get a single quiz (teachers see answers, students don't)
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const role = (req as any).user.role;

    let query = Quiz.findById(req.params.id).populate("createdBy", "name");

    // Strip correct answers for students
    if (role === "student") {
      query = query.select("-questions.options.isCorrect") as any;
    }

    const quiz = await query.lean();
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    res.json({ success: true, data: quiz });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/quizzes/:id/submit ─────────────────────────────────────────────
// Student submits answers — auto-graded instantly
router.post(
  "/:id/submit",
  authMiddleware,
  roleGuard("student"),
  async (req: Request, res: Response) => {
    try {
      const { answers } = req.body;
      // answers = [{ questionIndex: 0, selectedOptionIndex: 2 }, ...]

      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
      if (!quiz.isPublished) {
        return res.status(403).json({ success: false, message: "Quiz is not available yet" });
      }

      // Auto-grade
      let scored = 0;
      const breakdown = quiz.questions.map((q, qi) => {
        const studentAnswer = answers.find((a: any) => a.questionIndex === qi);
        const selectedIdx = studentAnswer?.selectedOptionIndex ?? -1;
        const isCorrect = selectedIdx >= 0 && q.options[selectedIdx]?.isCorrect === true;
        if (isCorrect) scored += q.marks;

        return {
          questionIndex: qi,
          questionText: q.questionText,
          selectedOptionIndex: selectedIdx,
          isCorrect,
          marks: isCorrect ? q.marks : 0,
        };
      });

      const percentage = Math.round((scored / quiz.totalMarks) * 100);
      const passed = scored >= quiz.passingMarks;

      // Derive letter grade
      const grade =
        percentage >= 90 ? "A" :
        percentage >= 75 ? "B" :
        percentage >= 60 ? "C" :
        percentage >= 45 ? "D" : "F";

      res.json({
        success: true,
        data: {
          quizTitle: quiz.title,
          scored,
          totalMarks: quiz.totalMarks,
          percentage,
          passed,
          grade,
          breakdown,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── PATCH /api/quizzes/:id/publish ──────────────────────────────────────────
// Teacher publishes or unpublishes a quiz
router.patch(
  "/:id/publish",
  authMiddleware,
  roleGuard("teacher", "admin"),
  async (req: Request, res: Response) => {
    try {
      const { isPublished } = req.body;

      const quiz = await Quiz.findByIdAndUpdate(
        req.params.id,
        { isPublished },
        { new: true }
      );
      if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

      res.json({
        success: true,
        message: isPublished ? "Quiz published" : "Quiz unpublished",
        data: { isPublished: quiz.isPublished },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// ─── DELETE /api/quizzes/:id ──────────────────────────────────────────────────
router.delete(
  "/:id",
  authMiddleware,
  roleGuard("teacher", "admin"),
  async (req: Request, res: Response) => {
    try {
      const quiz = await Quiz.findByIdAndDelete(req.params.id);
      if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
      res.json({ success: true, message: "Quiz deleted" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

export default router;
