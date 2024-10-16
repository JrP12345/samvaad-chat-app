import express from "express";
import {
  userRegister,
  userLogin,
  getUserInfo,
  search,
  getAllUsers,
} from "../controllers/user.js";
import authMiddleware from "../middlewares/auth.js";
import { Group } from "../models/group.js";
const router = express.Router();

router.post("/register", userRegister);
router.post("/login", userLogin);
router.get("/check", (req, res) => {
  if (req.cookies.token) {
    // Token exists; user is authenticated
    res.status(200).json({ isAuthenticated: true });
  } else {
    // Token does not exist; user is not authenticated
    res.status(200).json({ isAuthenticated: false });
  }
});
router.get("/userInfo", authMiddleware, getUserInfo);
router.get("/search", authMiddleware, search);
router.get("/users", getAllUsers);
router.get("/groups", async (req, res) => {
  try {
    const groups = await Group.find(); // Fetch all groups from the database
    res.status(200).json(groups); // Send groups as a response
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Error fetching groups" });
  }
});
router.post("/logout", (req, res) => {
  // Clear the cookie by setting it with an empty value and an immediate expiration date
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });

  // Optionally, you can send a response to indicate the logout was successful
  res.status(200).json({ message: "Logged out successfully" });
});

export default router;
