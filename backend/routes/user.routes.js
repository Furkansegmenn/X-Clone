import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
	followUnfollowUser,
	getSuggestedUsers,
	getUserProfile,
	updateUserProfile,
} from "../controllers/user.controllers.js";

const router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile); //burda token kontrolü yapmalı mıyız bilmiyorum ?
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.post("/update", protectRoute, updateUserProfile);

export default router;
