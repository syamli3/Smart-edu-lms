// backend/src/routes/analytics.routes.ts
import { Router, Request, Response } from "express";
import Enrollment from "../models/enrollment.model";
import Quiz from "../models/quiz.model";
import { authMiddleware, roleGuard } from "../middleware/auth.middleware";

const router = Router();

// ─── GET /api/analytics/admin/overview ───────────────────────────────────────
// Admin dashboard: platform-wide stats
router.get(
  "/admin/overview",
  authMiddleware,
  roleGuard("admin"),
  async (_req: Request, res: Response) => {
    try {
      const [enrollmentStats, completionByMonth, gradeDistribution] = await Promise.all([

        // Enrollments grouped by status
        Enrollment.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // New enrollments per month (last 6 months)
        Enrollment.aggregate([
          {
            $match: {
              enrolledAt: {
                $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
              },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$enrolledAt" },
                month: { $month: "$enrolledAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),

        // Grade distribution across all enrollments
        Enrollment.aggregate([
          { $match: { grade: { $ne: null } } },
          { $group: { _id: "$grade", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const total = enrollmentStats.reduce((s, g) => s + g.count, 0);
      const completed = enrollmentStats.find((e) => e._id === "completed")?.count ?? 0;
      const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";

      res.json({
        success: true,
        data: {
          summary: { total, completed, completionRate: `${completionRate}%` },
          enrollmentsByStatus: enrollmentStats,
          monthlyEnrollments: completionByMonth,
          gradeDistribution,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── GET /api/analytics/teacher/course/:courseId ─────────────────────────────
// Teacher sees stats for one of their courses
router.get(
  "/teacher/course/:courseId",
  authMiddleware,
  roleGuard("teacher", "admin"),
  async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;

      const [progressBuckets, statusBreakdown, avgProgress] = await Promise.all([

        // Students grouped into progress buckets: 0-25, 26-50, 51-75, 76-100
        Enrollment.aggregate([
          { $match: { course: new (require("mongoose").Types.ObjectId)(courseId) } },
          {
            $bucket: {
              groupBy: "$progress",
              boundaries: [0, 26, 51, 76, 101],
              default: "other",
              output: { count: { $sum: 1 } },
            },
          },
        ]),

        // Status breakdown for this course
        Enrollment.aggregate([
          { $match: { course: new (require("mongoose").Types.ObjectId)(courseId) } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),

        // Average progress across all students
        Enrollment.aggregate([
          { $match: { course: new (require("mongoose").Types.ObjectId)(courseId) } },
          { $group: { _id: null, avgProgress: { $avg: "$progress" }, totalStudents: { $sum: 1 } } },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          avgProgress: Number(avgProgress[0]?.avgProgress?.toFixed(1) ?? 0),
          totalStudents: avgProgress[0]?.totalStudents ?? 0,
          progressBuckets: progressBuckets.map((b) => ({
            range: b._id === 0 ? "0-25%" : b._id === 26 ? "26-50%" : b._id === 51 ? "51-75%" : "76-100%",
            count: b.count,
          })),
          statusBreakdown,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── GET /api/analytics/student/my ───────────────────────────────────────────
// Student's own learning stats
router.get("/student/my", authMiddleware, async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user._id;

    const stats = await Enrollment.aggregate([
      { $match: { student: studentId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgProgress: { $avg: "$progress" },
        },
      },
    ]);

    const totalEnrolled = stats.reduce((s, g) => s + g.count, 0);
    const completed = stats.find((s) => s._id === "completed")?.count ?? 0;
    const avgProgress = stats.find((s) => s._id === "active")?.avgProgress ?? 0;
    const certificates = await Enrollment.countDocuments({
      student: studentId,
      certificateIssued: true,
    });

    res.json({
      success: true,
      data: {
        totalEnrolled,
        completed,
        certificatesEarned: certificates,
        avgProgressOnActiveCourses: Number(avgProgress.toFixed(1)),
        breakdown: stats,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/analytics/leaderboard/:courseId ────────────────────────────────
// Top students in a course ranked by progress + grade
router.get(
  "/leaderboard/:courseId",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const leaderboard = await Enrollment.find({
        course: req.params.courseId,
        status: { $in: ["active", "completed"] },
      })
        .populate("student", "name email")
        .sort({ progress: -1, grade: 1 })
        .limit(10)
        .select("student progress grade status certificateIssued")
        .lean();

      const ranked = leaderboard.map((e, i) => ({ rank: i + 1, ...e }));

      res.json({ success: true, data: ranked });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

export default router;
