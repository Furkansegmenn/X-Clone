import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { createPost, deletePost } from "../controllers/post.controllers.js";

const router = express.Router();

router.post("/create", protectRoute, createPost);
// router.post("/like/:id", protectRoute, likeUnlikePost);
// router.post("/comment/:id", protectRoute, commentOnPost);
router.delete("/:id", protectRoute, deletePost);
// router.update("/", protectRoute, updatePost);

export default router;
