// backend/src/routes/enrollment.routes.ts
import { Router, Request, Response } from "express";
import Enrollment from "../models/enrollment.model";
import { authMiddleware, roleGuard } from "../middleware/auth.middleware"; // reuse existing

const router = Router();

// ─── POST /api/enrollments ────────────────────────────────────────────────────
// Student enrolls in a course
router.post("/", authMiddleware, roleGuard("student"), async (req: Request, res: Response) => {
  try {
    const { courseId } = req.body;
    const studentId = (req as any).user._id;

    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
    });

    res.status(201).json({ success: true, data: enrollment });
  } catch (err: any) {
    // Duplicate key = already enrolled
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Already enrolled in this course" });
    }
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── GET /api/enrollments/my ──────────────────────────────────────────────────
// Student views all their own enrollments with course details
router.get("/my", authMiddleware, async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user._id;

    const enrollments = await Enrollment.find({ student: studentId })
      .populate("course", "title description thumbnail category")
      .sort({ enrolledAt: -1 })
      .lean();

    res.json({ success: true, data: enrollments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/enrollments/course/:courseId ────────────────────────────────────
// Teacher/Admin sees all students enrolled in a course
router.get(
  "/course/:courseId",
  authMiddleware,
  roleGuard("teacher", "admin"),
  async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const { status, page = 1, limit = 20 } = req.query;

      const filter: any = { course: courseId };
      if (status) filter.status = status;

      const skip = (Number(page) - 1) * Number(limit);

      const [enrollments, total] = await Promise.all([
        Enrollment.find(filter)
          .populate("student", "name email")
          .sort({ enrolledAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Enrollment.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: enrollments,
        pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── PATCH /api/enrollments/:id/progress ─────────────────────────────────────
// Student marks a lesson complete — progress auto-recalculates
router.patch("/:id/progress", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { lessonId, totalLessons } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    // Add lesson to completed list (no duplicates)
    const alreadyDone = enrollment.completedLessons
      .map((l) => l.toString())
      .includes(lessonId);

    if (!alreadyDone) {
      enrollment.completedLessons.push(lessonId);
    }

    // Recalculate progress percentage
    enrollment.progress = Math.round(
      (enrollment.completedLessons.length / totalLessons) * 100
    );

    // Auto-complete if 100%
    if (enrollment.progress >= 100) {
      enrollment.status = "completed";
      enrollment.certificateIssued = true;
    }

    await enrollment.save();

    res.json({
      success: true,
      data: {
        progress: enrollment.progress,
        status: enrollment.status,
        certificateIssued: enrollment.certificateIssued,
        completedLessons: enrollment.completedLessons.length,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/enrollments/:id/grade ────────────────────────────────────────
// Teacher assigns a final grade
router.patch(
  "/:id/grade",
  authMiddleware,
  roleGuard("teacher", "admin"),
  async (req: Request, res: Response) => {
    try {
      const { grade } = req.body;
      const validGrades = ["A", "B", "C", "D", "F"];

      if (!validGrades.includes(grade)) {
        return res.status(400).json({ success: false, message: "Invalid grade. Use A-F" });
      }

      const enrollment = await Enrollment.findByIdAndUpdate(
        req.params.id,
        { grade },
        { new: true }
      ).populate("student", "name email");

      if (!enrollment) {
        return res.status(404).json({ success: false, message: "Enrollment not found" });
      }

      res.json({ success: true, data: enrollment });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// ─── DELETE /api/enrollments/:id ─────────────────────────────────────────────
// Student drops a course
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user._id;

    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.id, student: studentId },
      { status: "dropped" },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    res.json({ success: true, message: "Course dropped successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
