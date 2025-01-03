import express from "express";
import {
  content,
  deleteContent,
  getContent,
  getProfile,
  signin,
  signup,
  updateContent,
} from "../controllers/userController";
import authMiddleware from "../Middlewares/authMiddleware";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/create", authMiddleware, content);
router.get("/content", authMiddleware, getContent);
router.get("/profile", authMiddleware, getProfile);
router.delete("/content/:id", authMiddleware, deleteContent);
router.put("/content/:id", authMiddleware, updateContent);
export default router;
