import express from "express";

const userRoutes = express.Router();

import {
  register,
  login,
  updateUser,
  deleteUser,
  logoutUser,
  getUserProfile,
  getUsers,
} from "../controllers/user.ts";
import { protect, authorize } from "../middleware/auth.ts";

// ✅ FIXED: register should NOT be protected
userRoutes.post("/register", register);

// login
userRoutes.post("/login", login);

userRoutes.post("/logout", logoutUser);

// protected routes
userRoutes.get("/profile", protect, getUserProfile);

userRoutes.get("/", protect, authorize(["admin", "teacher"]), getUsers);

userRoutes.put(
  "/update/:id",
  protect,
  authorize(["admin", "teacher"]),
  updateUser
);

userRoutes.delete(
  "/delete/:id",
  protect,
  authorize(["admin", "teacher"]),
  deleteUser
);

export default userRoutes;